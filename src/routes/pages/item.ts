/**
 * Item Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import moment from "moment";
import { Permission } from "../../lib/permission";
// import * as PDFDocument from "pdfkit";
import PDFDocument = require('pdfkit');
// import JsBarcode from "jsbarcode";
// const { createCanvas } = require('canvas');
// import * as Canvas from 'canvas';
// import codes = require('rescode');
// import * as codes from "rescode";
const fs = require('fs');

const jwtCredentialId = config.jwt.defCredentialId;

class ItemRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/item").all(Permission.onLoad).get(this.getList);
    this.route("/item/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/item/detail/:id").all(Permission.onLoad).get(this.getDetail).post(this.postDetail);
    this.route("/item/counter/:id").all(Permission.onLoad).get(this.getCounter).post(this.postCounter);
    this.route("/item/barcode/:id").all(Permission.onLoad).get(this.getBarcode).post(this.postBarcode);
    this.route("/item-dataentry").all(Permission.onLoad).get(this.getDataList);
    this.route("/item-dataentry/entry").all(Permission.onLoad).get(this.getDataEntry).post(this.postDataEntry);
    this.route("/item-dataentry/edit/:id").all(Permission.onLoad).get(this.getDataEdit).post(this.postDataEdit);
    this.route("/item-dataentry/delete/:id").all(Permission.onLoad).post(this.postDataDelete);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("token ", params.token);
          res.render("dashboard/item", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/item/entry", params: {}, listUrl: "/item" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/item-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const db = RestApi.getDb("item");
    db.insert(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const postUrl = `/item/detail/${id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: {}, listUrl: "/polish-finish" };
    params = Permission.getMenuParams(params, req, res);
    let total_reduct_wgt = 0;
    let goldsmith_code_id = "";
    let total_cost = 0;
    let net_wgt = 0;
    let goldrate = "";

    RestApi.getDb("polish")
      // .leftJoin("goldsmith_code", "polish.goldsmith_code_id", "goldsmith_code.id")
      .leftJoin("polisher", "polish.polisher_id", "polisher.id")
      .where("polish.id", id)
      .select("polish.*", "polisher.name")
      .first()
      .then((result) => {
        result.date = Utils.toDisplayDate(result.date);
        // total_reduct_wgt += Number(result.reduce_wgt_gm);
        net_wgt = Number(result.wgt_gm);
        params.params.polish = result;
        goldsmith_code_id = result.goldsmith_code_id;
        if (result.get_outside_id == "") {
          return RestApi.getDb("goldsmith_code").where("id", result.goldsmith_code_id).select().first();
        } else {
          return RestApi.getDb("get_outside").leftJoin("give_outside_items", "give_outside_item_id", "give_outside_items.id").where("get_outside.id", result.get_outside_id).select("give_outside_items.code").first();
        }
      })
      .then((result) => {
        params.params.polish.code = result.code;
        return RestApi.getDb("get_outside").leftJoin("goldsmith", "get_outside.goldsmith_id", "goldsmith.id").where("get_outside.id", params.params.polish.get_outside_id).select("get_outside.*", "goldsmith.goldsmith_name").first();
      })
      .then((result) => {
        if (result && result != "") {
          total_cost += Number(result.cost);
          total_reduct_wgt += Number(result.gm_amt);
          net_wgt -= Number(result.diamond_wgt_gm);
          result.date = Utils.toDisplayDate(result.date);
          result.cost = Utils.addComma(result.cost);
          params.params.get_outside = result;
          goldrate = result.goldrate;
          return RestApi.getDb("give_outside_items").leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_outside_items.diamond_id", "diamond_items.id").leftJoin("give_outside", "give_outside_id", "give_outside.id").leftJoin("goldsmith", "give_outside.goldsmith_id", "goldsmith.id").where("give_outside_items.id", result.give_outside_item_id).select("give_outside_items.*", "give_outside_items.diamond_wgt_ct as wgt_ct", "whole_diamond.code as wholediamond_code", "diamond_items.code as diamond_code", "whole_diamond.usd_per_carat", "whole_diamond.current_usd", "goldsmith.goldsmith_name");
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (result) {
          result[0].date = Utils.toDisplayDate(result[0].createddate);
          params.params.give_outside_item = result[0];
          // params.diamonds_arr = result;
        }
        return RestApi.getDb("get_diamond").leftJoin("goldsmith", "get_diamond.goldsmith_id", "goldsmith.id").where("get_diamond.id", params.params.polish.get_diamond_id).select("get_diamond.*", "goldsmith.goldsmith_name").first();
      })
      .then((result) => {
        if (result && result != "") {
          params.set_diamond_cost = Utils.addComma(result.set_diamond_cost);
          total_cost += Number(result.set_diamond_cost);
          total_reduct_wgt += Number(result.gm_amt);
          net_wgt -= Number(result.diamond_wgt_gm);
          result.date = Utils.toDisplayDate(result.date);
          params.params.get_diamond = result;
          goldrate = result.goldrate;
          return RestApi.getDb("give_diamond").leftJoin("goldsmith", "give_diamond.goldsmith_id", "goldsmith.id").where("give_diamond.id", result.give_diamond_id).select("give_diamond.*", "goldsmith.goldsmith_name").first();
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (result && result != "") {
          result.date = Utils.toDisplayDate(result.date);
          params.params.give_diamond = result;
          return RestApi.getDb("give_diamond_items").leftJoin("whole_diamond", "give_diamond_items.wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_diamond_items.diamond_id", "diamond_items.id").where("give_diamond_id", result.id).select("give_diamond_items.*", "whole_diamond.code as wholediamond_code", "diamond_items.code as diamond_code", "whole_diamond.usd_per_carat", "whole_diamond.current_usd");
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (result) {
          if (result.length > 0) {
            params.diamonds_arr = result;
          }
        }
        return RestApi.getDb("first_polish").leftJoin("polisher", "polisher_id", "polisher.id").where("goldsmith_code_id", goldsmith_code_id).select("first_polish.*", "polisher.name as polisher_name").first();
      })
      .then((result) => {
        if (result && result != "") {
          result.date = Utils.toDisplayDate(result.date);
          // total_reduct_wgt += Number(result.reduce_wgt_gm);
          params.params.first_polish = result;
        }
        return RestApi.getDb("get_goldsmith").leftJoin("goldsmith", "get_goldsmith.goldsmith_id", "goldsmith.id").where("goldsmith_code_id", goldsmith_code_id).select("get_goldsmith.*", "goldsmith.goldsmith_name").first();
      })
      .then((result) => {
        if (result && result != "") {
          result.date = Utils.toDisplayDate(result.date);
          params.params.get_goldsmith = result;
          total_reduct_wgt += Number(result.gm_amt);
        }
        return RestApi.getDb("give_goldsmith").leftJoin("give_goldsmith_items", "give_goldsmith.id", "give_goldsmith_items.give_goldsmith_id").leftJoin("goldsmith", "give_goldsmith.goldsmith_id", "goldsmith.id").where("give_goldsmith_items.goldsmith_code_id", goldsmith_code_id).select("give_goldsmith_items.*", "goldsmith.goldsmith_name").first();
      })
      .then((result) => {
        if (result && result != "") {
          result.date = Utils.toDisplayDate(result.date);
          params.params.give_goldsmith = result;
          return RestApi.getDb("give_goldsmith_items").where("item_id", result.item_id).select("wax_cost", "mould_cost", "goldrate", "goldrate_price").first();
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (result && result != "") {
          params.wax_cost = Utils.addComma(result.wax_cost);
          params.mould_cost = Utils.addComma(result.mould_cost);
          params.goldrate_price = result.goldrate_price;
          total_cost += Number(result.wax_cost);
          total_cost += Number(result.mould_cost);
          goldrate = result.goldrate;
        }
        return RestApi.getDb("order_mould").leftJoin("order_mould_items", "order_mould.id", "order_mould_items.order_mould_id").leftJoin("goldsmith_code", "order_mould_items.id", "goldsmith_code.order_mould_item_id").where("goldsmith_code.id", goldsmith_code_id).select("order_mould.*", "order_mould_items.wgt_gm", "goldsmith_code.code").first();
      })
      .then((result) => {
        if (result && result != "") {
          result.date = Utils.toDisplayDate(result.date);
          params.params.mould = result;
        }
        return RestApi.getDb("goldrate_price").orderBy("createddate", "desc").first();
      })
      .then((result) => {
        if (params.diamonds_arr) {
          if (params.diamonds_arr.length > 0) {
            params.diamonds_arr.forEach((diamond: any) => {
              // const cost = Number(result.diamond) * Number(diamond.wgt_ct);
              const cost = Number(diamond.usd_per_carat) * Number(diamond.wgt_ct) * Number(diamond.current_usd);
              diamond.diamond_cost = Utils.addComma(cost.toFixed(2));
              diamond.current_usd = Utils.addComma(diamond.current_usd.toFixed(2));
            });
          }
        }
        let goldrate_price = 0;
        if (goldrate == "a")
          goldrate_price = result.a;
        else if (goldrate == "b")
          goldrate_price = result.b;
        else if (goldrate == "c")
          goldrate_price = result.c;
        else if (goldrate == "d")
          goldrate_price = result.d;
        const total_amount = Utils.calc_total(net_wgt.toString(), goldrate_price.toString());
        const wgt_kpy = Utils.ChangeGmToKPY(net_wgt.toString());
        const wgt_kpy_arr = wgt_kpy.toString().split('-');
        const item_net_wgt: any = {
          wgt_gm: net_wgt,
          // wgt_kpy: Utils.ChangeGmToKPY(net_wgt.toString()),
          wgt_k: wgt_kpy_arr[0],
          wgt_p: wgt_kpy_arr[1],
          wgt_y: wgt_kpy_arr[2],
          goldrate_price: Utils.addComma(goldrate_price),
          // price: total_amount.toFixed(2)
          price: Utils.addComma(total_amount.toFixed(2))
        };
        params.item_net_wgt = item_net_wgt;
        const toal_reduce_amount = Utils.calc_total(total_reduct_wgt.toString(), goldrate_price.toString());
        const wgt_reduce_kpy = Utils.ChangeGmToKPY(total_reduct_wgt.toString());
        const wgt_reduce_kpy_arr = wgt_reduce_kpy.toString().split('-');
        const item_reduce_wgt: any = {
          wgt_gm: total_reduct_wgt.toFixed(2),
          // wgt_kpy: Utils.ChangeGmToKPY(total_reduct_wgt.toString()),
          wgt_k: wgt_reduce_kpy_arr[0],
          wgt_p: wgt_reduce_kpy_arr[1],
          wgt_y: wgt_reduce_kpy_arr[2],
          goldrate_price: Utils.addComma(goldrate_price),
          // price: toal_reduce_amount.toFixed(2)
          price: Utils.addComma(toal_reduce_amount.toFixed(2))
        };
        params.item_reduce_wgt = item_reduce_wgt;
        params.total_cost = Utils.addComma(total_cost);
        params.params.date = Utils.toDisplayDate(new Date());
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
            return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/item-detail", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    console.log("data ", data);
    const item: any = {
      detail_date: Utils.toSqlDate(data.date),
      branch_id: data.branch_id,
      category_id: data.category_id,
      code: data.code,
      count: data.count,
      grade_id: data.grade_id,
      office_percent: data.office_percent.replace(/,/g, ''),
      goldsmith_percent: data.goldsmith_percent,
      goldsmith_cost: data.goldsmith_cost.replace(/,/g, ''),
      wgt_k: data.wgt_k,
      wgt_p: data.wgt_p,
      wgt_y: data.wgt_y,
      reduce_wgt_gm: data.reduce_wgt_gm,
      reduce_wgt_k: data.reduce_wgt_k,
      reduce_wgt_p: data.reduce_wgt_p,
      reduce_wgt_y: data.reduce_wgt_y,
      price: data.price,
      ori_price: data.total_price.replace(/,/g, ''),
      is_detail: 1,
      updateddate: Utils.toSqlDate(new Date())
    };
    RestApi.getDb("polish")
      .where("id", data.id)
      .first()
      .select()
      .then((result) => {
        return RestApi.getDb("item").where("id", result.item_id).update(item, "id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getBarcode(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const postUrl = `/item/barcode/${id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: {}, listUrl: "/item" };
    params = Permission.getMenuParams(params, req, res);
    console.log("id ", id);
    RestApi.getDb("item")
      .where("id", id)
      .select()
      .then((result) => {
        params.params.id = result[0].id;
        params.params.code = result[0].code;
        params.params.wgt_gm = result[0].wgt_gm;
        params.params.wgt_k = result[0].wgt_k;
        params.params.wgt_p = result[0].wgt_p;
        params.params.wgt_y = result[0].wgt_y;
        params.params.price = Utils.numberWithCommas(result[0].price);
        params.params.diamond_qty = result[0].diamond_qty;
        params.params.type = result[0].status;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/barcode", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postBarcode(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    RestApi.getDb("item")
      .where("id", data.id)
      .update({ showroom_date: Utils.toSqlDate(data.date), is_stock: 1, updateddate: Utils.toSqlDate(new Date()) }, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getCounter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const postUrl = `/item/counter/${id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: {}, listUrl: "/item" };
    params = Permission.getMenuParams(params, req, res);
    // var doc = new PDFDocument({
    //   size: [150,40]
    // });
    
    RestApi.getDb("item")
      .where("id", id)
      .select()
      .then((result) => {
        params.params.id = result[0].id;
        params.params.code = result[0].code;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");

        // var marginTB = 4;
        // var marginLR = 2;
        // const price = Utils.addComma(result[0].price);
        // const type = result[0].status;
        // const data = {};
        // if (type == "diamond") {
        //   doc.font("Times-Roman")
        //       .fontSize(11)
        //       .text(result[0].wgt_gm+"G",0+marginLR,6+marginTB,{width:80,height:20,align:"center"})
        //       .text("DC"+result[0].diamond_qty,0+marginLR,22+marginTB,{width:80,height:20,align:'center'})
        // } else if (type == "pt") {
        //   doc.font("Times-Roman")
        //       .fontSize(11)
        //       .text(result[0].wgt_gm+"G",0+marginLR,11+marginTB,{width:80,height:20,align:"center"})
        // } else if (type == "gold") {
        //   console.log("Gold");
        //   doc.font("Times-Roman")
        //       .fontSize(11)
        //       .text(result[0].wgt_k+"-"+result[0].wgt_p+"-"+result[0].wgt_y,0+marginLR,11+marginTB,{width:80,height:20,align:"center"})
        // }
        // doc.font("Times-Roman")
        //     .fontSize(10)
        //     .text(price+"MMK",75+marginLR,27+marginTB,{width:80,height:20,align:"center"})
        // doc.font("./public/fonts/Code39r.ttf")
        //     .fontSize(20)
        //     .text(result[0].code,75+marginLR,0+marginTB,{width:80,height:20,align:"center"})
        // doc.font("Times-Roman")
        //     .fontSize(7)
        //     .text(result[0].code,75+marginLR,20+marginTB,{width:80,height:10,align:"center"});
        // doc.end();
        // doc.pipe(fs.createWriteStream("./public/upload/barcode/doc.pdf"));
        // -----------------------------------------
        // doc.text(data,25+marginLR,0+marginTB,{width:80,height:20,align:'center'})
        // const barcode = "*"+result[0].code+"*";
        // doc.font("./public/fonts/Code39r.ttf")
        //     .fontSize(35)
        //     .text(barcode,25+marginLR,0+marginTB,{width:80,height:20,align:'center'})

        // const width = 1200
        // const height = 630
        // Canvas.default.createCanvas();
        // // const canvas = createCanvas(width, height)
        // const context = Canvas.default.getContext('2d')

        // context.fillStyle = '#000'
        // context.fillRect(0, 0, width, height)
        // context.font = 'bold 70pt Menlo'
        // context.textAlign = 'center'
        // context.textBaseline = 'top'
        // context.fillStyle = '#3574d4'
        // const text = 'Hello, World!'
        // const textWidth = context.measureText(text).width
        // context.fillRect(600 - textWidth / 2 - 10, 170 - 5, textWidth + 20, 120)
        // context.fillStyle = '#fff'
        // context.fillText(text, 600, 170)

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/place-counter-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postCounter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    RestApi.getDb("item")
      .where("id", data.id)
      .update({ showroom_date: Utils.toSqlDate(data.date), is_stock: 1, updateddate: Utils.toSqlDate(new Date()) }, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDataList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("token ", params.token);
          res.render("dashboard/item-data", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item-data", params);
    }
  }

  public getDataEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/item-dataentry/entry", params: {}, listUrl: "/item-dataentry" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/item-dataentry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item-dataentry", params);
    }
  }

  public postDataEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.showroom_date = data.date;
    data.id = uuid.v4();
    data.is_entry = 1;
    data.is_stock = 1;
    data.wgt_k = data.wgt_k ? data.wgt_k : 0;
    data.wgt_p = data.wgt_p ? data.wgt_p : 0;
    data.wgt_y = data.wgt_y ? data.wgt_y : 0;
    data.wgt_ct = data.wgt_ct ? data.wgt_ct : 0;
    data.reduce_wgt_gm = data.reduce_wgt_gm ? data.reduce_wgt_gm : 0;
    data.reduce_wgt_k = data.reduce_wgt_k ? data.reduce_wgt_k : 0;
    data.reduce_wgt_p = data.reduce_wgt_p ? data.reduce_wgt_p : 0;
    data.reduce_wgt_y = data.reduce_wgt_y ? data.reduce_wgt_y : 0;
    // if (data.diamond_qty < 1)
    //   data.diamond_qty = 0;
    // if (data.wgt_ct < 1)
    //   data.wgt_ct = 0.00;
    const db = RestApi.getDb("item");
    db.insert(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDataEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }

    const postUrl = `/item-dataentry/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/item-dataentry" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("item").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDate(params.params.date);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/item-dataentry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postDataEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.showroom_date = data.date;
    console.log("data ", data);
    let db = RestApi.getDb("item");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDataDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("item");
    db = db.where({ id: data.id });
    db.delete("id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new ItemRouter();