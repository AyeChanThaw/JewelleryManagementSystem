/**
 * Divide PT Routes
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

const jwtCredentialId = config.jwt.defCredentialId;

class DividePTRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/divide-pt").all(Permission.onLoad).get(this.getList);
    this.route("/divide-pt/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/divide-pt/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/divide-pt/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/divide-pt", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/divide-pt", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/divide-pt/entry", params: {}, listUrl: "/divide-pt" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.item_array = [];
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/divide-pt-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/divide-pt-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const real_item_arr: any = [];
    const query: any = [];
    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.divide_pt_id = data.id;
      item = comfunc.fillDefaultFields(item);
      // if (data.isfinished == 1) {
      const kpy = Utils.ChangeGmToKPY(item.wgt_gm);
      const kpy_string = kpy.split("-");
      const k = kpy_string[0];
      const p = kpy_string[1];
      const y = kpy_string[2];
      let real_item: any = {
        id: uuid.v4(),
        date: Utils.toSqlDate(new Date()),
        code: item.code,
        count: item.count,
        price: item.price,
        item_name: item.item_name,
        wgt_gm: item.wgt_gm,
        wgt_k: k,
        wgt_p: p,
        wgt_y: y,
        // image: item.image,
        category_id: item.category_id,
        is_stock: 1,
        status: "pt"
      };
      real_item = comfunc.fillDefaultFields(real_item);
      real_item_arr.push(real_item);
      item.item_id = real_item.id;
      // }
      item_arr.push(item);
    });
    // if (data.isfinished == 1) {
    query.push(RestApi.getKnex().batchInsert("item", real_item_arr));
    // }
    const count = item_arr.length;
    query.push(RestApi.getDb("purchase_pt_items").where("id", data.purchase_pt_items_id).decrement("current_qty", count));
    delete data.item_array;
    delete data.qty;
    // RestApi.getDb("divide_pt")
    //   .insert(data, "id")
    //   .then((result) => {
    //     console.log("insert divide pt ");
    //     if (query.length > 0)
    //       return Promise.all(query);
    //     else
    //       return data;
    //   })
    //   .then((result) => {
    //     console.log("promise insert");
    //     return RestApi.getKnex().batchInsert("divide_pt_items", item_arr);
    //   })
    //   .then((result) => {
    //     res.json({ "success": result });
    //   })
    //   .catch((err) => {
    //     console.log(`${err}`);
    //     res.json({ "error": err });
    //   });
    query.push(RestApi.getDb("divide_pt").insert(data, "id"));
    query.push(RestApi.getKnex().batchInsert("divide_pt_items", item_arr));
    RestApi.getKnex().transaction(function (trx) {
      Promise.all(query)
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then((result) => {
      res.json({ "success": result });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({ "error": err });
    });
  }

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/divide-pt/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/divide-pt" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("divide_pt")
      .leftJoin("purchase_pt_items", "purchase_pt_items_id", "purchase_pt_items.id")
      .where({ "divide_pt.id": data.id })
      .select("divide_pt.*", "purchase_pt_items.current_qty")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        params.params.purchase_pt_items = params.params.purchase_pt_items_id;
        return RestApi.getDb("divide_pt_items").leftJoin("category", "divide_pt_items.category_id", "category.id").where("divide_pt_id", data.id).select("divide_pt_items.*", "category.category_name as category");
      })
      .then((result) => {
        params.params.qty = Number(params.params.current_qty) + result.length;
        params.item_array = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/divide-pt-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    const item: any = {};
    const item_arr: any = [];
    const real_item_arr: any = [];
    const code_arr: any = [];
    const query: any = [];
    let count = 0;
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    const item_array = JSON.parse(data.item_array);
    item_array.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
      } else {
        item.id = uuid.v4();
        item.divide_pt_id = data.id;
      }
      item.id = uuid.v4();
      item = comfunc.fillDefaultFields(item);
      if (data.isfinished == 1) {
        const kpy = Utils.ChangeGmToKPY(item.wgt_gm);
        const kpy_string = kpy.split("-");
        const k = kpy_string[0];
        const p = kpy_string[1];
        const y = kpy_string[2];
        let real_item: any = {
          id: uuid.v4(),
          // date: data.date,
          code: item.code,
          count: item.count,
          price: item.price,
          item_name: item.item_name,
          wgt_gm: item.wgt_gm,
          wgt_k: k,
          wgt_p: p,
          wgt_y: y,
          // image: item.image,
          category_id: item.category_id,
          is_stock: 1,
          status: "pt"
        };
        real_item = comfunc.fillDefaultFields(real_item);
        real_item_arr.push(real_item);
        item.item_id = real_item.id;
      }
      item_arr.push(item);
    });
    if (data.isfinished == 1) {
      query.push(RestApi.getKnex().batchInsert("item", real_item_arr));
    }
    data.updateddate = Utils.toSqlDate(new Date());
    const updatdate = Utils.toSqlDate(new Date());
    let db = RestApi.getDb("divide_pt");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete data.qty;
    delete data.item_array;
    RestApi.getDb("divide_pt_items")
      .where("divide_pt_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          count = result.length;
          query.push(RestApi.getDb("purchase_pt_items").where("id", data.purchase_pt_items_id).increment("current_qty", count));
        }
        count = item_array.length;
        query.push(RestApi.getDb("purchase_pt_items").where("id", data.purchase_pt_items_id).decrement("current_qty", count));
        return db.update(data, "id");
      })
      .then((result) => {
        if (query.length > 0)
          return Promise.all(query);
        else
          return data;
      })
      .then((result) => {
        return RestApi.getDb("divide_pt_items").where("divide_pt_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("divide_pt_items", item_arr);
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let purchase_pt_items_id = "";
    RestApi.getDb("divide_pt")
      .where("id", data.id)
      .select()
      .then((result) => {
        purchase_pt_items_id = result[0].purchase_pt_items_id;
        return RestApi.getDb("divide_pt_items").where("divide_pt_id", data.id).select();
      })
      .then((result) => {
        const count = result.length;
        return RestApi.getDb("purchase_pt_items").where("id", purchase_pt_items_id).increment("current_qty", count);
      })
      .then((result) => {
        return RestApi.getDb("divide_pt_items").where("divide_pt_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("divide_pt").where({ id: data.id }).delete("id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new DividePTRouter();