/**
 * Order Mould Routes
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

class OrderMouldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-mould").all(Permission.onLoad).get(this.getList);
    this.route("/order-mould/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/order-mould/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/order-mould/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/ordermould-dataentry").all(Permission.onLoad).get(this.getDataList);
    this.route("/ordermould-dataentry/entry").all(Permission.onLoad).get(this.getDataEntry).post(this.postDataEntry);
    this.route("/ordermould-dataentry/edit/:id").all(Permission.onLoad).get(this.getDataEdit).post(this.postDataEdit);
    this.route("/ordermould-dataentry/delete/:id").all(Permission.onLoad).post(this.postDataDelete);
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
          res.render("dashboard/order-mould", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-mould", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-mould/entry", params: {}, listUrl: "/order-mould" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "order_mould")
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((mould) => {
            let count = 0;
            if (mould.lastdate == datecode) {
              count = mould.currentvalue;
            } else {
              mould.lastdate = datecode;
            }
            mould.count = count;
          });
        }
        params.params.codes = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.item_array = [];
        params.datecode = datecode;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-mould-entry", params);
      })
      .catch((err: any) => {
          next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const codes = JSON.parse(data.codes);
    const item_array = JSON.parse(data.item_array);
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const code_arr: any = [];
    const query: any = [];
    let gold_rate = "";

    if (data.goldrate == "a")
      gold_rate = "py_16";
    else if (data.goldrate == "b")
      gold_rate = "py_15";
    else if (data.goldrate == "c")
      gold_rate = "py_14";
    else if (data.goldrate == "d")
      gold_rate = "py_13";
    const reduce_gm = Number(data.raw_wgt_gm) + Number(data.reduce_wgt_gm);
    query.push(RestApi.getDb("stock").decrement(gold_rate, reduce_gm));

    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.order_mould_id = data.id;
      item = comfunc.fillDefaultFields(item);
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let code: any = {
          id: uuid.v4(),
          order_mould_item_id: item.id,
          category_id: item.category_id,
          wgt_gm: item.wgt_gm,
          goldrate: data.goldrate,
          code: item.code,
          status: "order_mould",
          use_status: "no-use"
        };
        code = comfunc.fillDefaultFields(code);
        code_arr.push(code);
      }
      else
        item.is_stock = 0;
      item_arr.push(item);
    });
    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    delete (data.codes);
    delete (data.item_array);

    RestApi.getDb("order_mould").insert(data, "id")
      .then((result) => {
        if (query.length > 1) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (code_arr.length > 0) {
          return RestApi.getKnex().batchInsert("goldsmith_code", code_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_mould_items", item_arr);
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
    const postUrl = `/order-mould/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/order-mould" };
    params = Permission.getMenuParams(params, req, res);
    let codes: any = [];

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "order_mould")
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((mould) => {
            let count = 0;
            if (mould.lastdate == datecode) {
              count = mould.currentvalue;
            } else {
              mould.lastdate = datecode;
            }
            mould.count = count;
          });
        }
        codes = result;
        params.datecode = datecode;

        return RestApi.getDb("order_mould").where({ "order_mould.id": data.id }).select();
      })
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        params.params.codes = codes;
        return RestApi.getDb("order_mould_items").leftJoin("category", "order_mould_items.category_id", "category.id").where("order_mould_id", data.id).select("order_mould_items.*", "category.category_name as category");
      })
      .then((result) => {
        params.item_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-mould-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    data.updateddate = Utils.toSqlDate(new Date());
    const items = JSON.parse(data.item_array);
    const codes = JSON.parse(data.codes);
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const code_arr: any = [];
    const query: any = [];
    let gold_rate = "";

    // if (data.isfinished == 1) {
    if (data.goldrate == "a")
      gold_rate = "py_16";
    else if (data.goldrate == "b")
      gold_rate = "py_15";
    else if (data.goldrate == "c")
      gold_rate = "py_14";
    else if (data.goldrate == "d")
      gold_rate = "py_13";

    let reduce_gm = Number(data.raw_wgt_gm) + Number(data.reduce_wgt_gm);
    query.push(RestApi.getDb("stock").decrement(gold_rate, reduce_gm));
    // }

    items.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
      } else {
        item.id = uuid.v4();
        item.order_mould_id = data.id;
      }
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let code: any = {
          id: uuid.v4(),
          order_mould_item_id: item.id,
          category_id: item.category_id,
          wgt_gm: item.wgt_gm,
          goldrate: data.goldrate,
          code: item.code,
          status: "order_mould",
          use_status: "no-use"
        };
        code = comfunc.fillDefaultFields(code);
        code_arr.push(code);
      }
      else
        item.is_stock = 0;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });

    delete data.codes;
    delete data.item_array;

    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    let db = RestApi.getDb("order_mould");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });

    RestApi.getDb("order_mould")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        let goldrate = "";
        if (result.goldrate == "a")
          goldrate = "py_16";
        else if (result.goldrate == "b")
          goldrate = "py_15";
        else if (result.goldrate == "c")
          goldrate = "py_14";
        else if (result.goldrate == "d")
          goldrate = "py_13";
        reduce_gm = Number(result.raw_wgt_gm) + Number(result.reduce_wgt_gm);
        query.push(RestApi.getDb("stock").increment(goldrate, reduce_gm));
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("order_mould_items").where("order_mould_id", data.id).delete();
      })
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        if (code_arr.length > 0) {
          return RestApi.getKnex().batchInsert("goldsmith_code", code_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_mould_items", item_arr);
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
    RestApi.getDb("order_mould")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        let goldrate = "";
        if (result.goldrate == "a")
          goldrate = "py_16";
        else if (result.goldrate == "b")
          goldrate = "py_15";
        else if (result.goldrate == "c")
          goldrate = "py_14";
        else if (result.goldrate == "d")
          goldrate = "py_13";
        const reduce_gm = Number(result.raw_wgt_gm) + Number(result.reduce_wgt_gm);
        return RestApi.getDb("stock").increment(goldrate, reduce_gm);
      })
      .then((result) => {
        return RestApi.getDb("order_mould_items").where("order_mould_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("order_mould").where({ id: data.id }).delete("id");
      })
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
          res.render("dashboard/ordermould-data", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/ordermould-data", params);
    }
  }

  public getDataEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/ordermould-dataentry/entry", params: {}, listUrl: "/ordermould-dataentry" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/ordermould-dataentry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/ordermould-dataentry", params);
    }
  }

  public postDataEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();

    let code: any = {
      id: uuid.v4(),
      order_mould_item_id: data.id,
      category_id: data.category_id,
      wgt_gm: data.wgt_gm,
      goldrate: data.goldrate,
      code: data.code,
      status: "order_mould",
      use_status: "no-use",
      is_entry: 1
    };
    code = comfunc.fillDefaultFields(code);

    RestApi.getDb("ordermould_dataentry").insert(data, "id")
      .then((result) => {
        return RestApi.getDb("goldsmith_code").insert(code, "id");
      })
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
    const postUrl = `/ordermould-dataentry/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/ordermould-dataentry" };
    params = Permission.getMenuParams(params, req, res);
    let codes: any = [];

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("ordermould_dataentry")
      .where("id", data.id)
      .select()
      .then((result) => {
        console.log("data ", result);
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/ordermould-dataentry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postDataEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    
    let code: any = {
      category_id: data.category_id,
      wgt_gm: data.wgt_gm,
      goldrate: data.goldrate,
      code: data.code,
      status: "order_mould",
      use_status: "no-use",
      is_entry: 1
    };

    let db = RestApi.getDb("ordermould_dataentry");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db.where({ id: data.id })
      .update(data, "id")
      .then((result) => {
        return RestApi.getDb("goldsmith_code").where({"order_mould_item_id": data.id, "is_entry": 1}).update(code, "id");
      })
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
    RestApi.getDb("give_goldsmith_items")
      .leftJoin("goldsmith_code", "goldsmith_code_id", "goldsmith_code.id")
      .where({"goldsmith_code.order_mould_item_id": data.id, "is_entry": 1})
      .select()
      .then((result) => {
        if (result.length > 0) {
          throw new Error("Can not Delete. Already Used.");
        } else {
          return RestApi.getDb("goldsmith_code").where({"order_mould_item_id": data.id, "is_entry": 1}).delete();
        }
      })
      .then((result) => {
        return RestApi.getDb("ordermould_dataentry").where({ id: data.id }).delete("id");
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

export default new OrderMouldRouter();