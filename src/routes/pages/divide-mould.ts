/**
 * Divide Mould Routes
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

class DivideMouldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/divide-mould").all(Permission.onLoad).get(this.getList);
    this.route("/divide-mould/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/divide-mould/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/divide-mould/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/divide-mould", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/divide-mould", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/divide-mould/entry", params: {}, listUrl: "/divide-mould" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "divide_mould")
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
        params.total_wgt_gm = 0;
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
        res.render("dashboard/divide-mould-entry", params);
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

    query.push(RestApi.getDb("purchase").where("id", data.purchase_id).decrement("mo_gm_balance", data.mould_wgt_gm));

    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.divide_mould_id = data.id;
      item = comfunc.fillDefaultFields(item);
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let code: any = {
          id: uuid.v4(),
          divide_mould_item_id: item.id,
          category_id: item.category_id,
          wgt_gm: item.wgt_gm,
          goldrate: data.goldrate,
          code: item.code,
          status: "divide_mould",
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

    RestApi.getDb("divide_mould")
      .insert(data, "id")
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
        return RestApi.getKnex().batchInsert("divide_mould_items", item_arr);
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
    const postUrl = `/divide-mould/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/divide-mould" };
    params = Permission.getMenuParams(params, req, res);
    let codes: any = [];

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "divide_mould")
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

        return RestApi.getDb("divide_mould").leftJoin("purchase", "purchase_id", "purchase.id").where({ "divide_mould.id": data.id }).select("divide_mould.*", "purchase.mo_gm_balance as total_wgt_gm");
      })
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        params.params.codes = codes;
        params.total_wgt_gm = result[0].total_wgt_gm;
        return RestApi.getDb("divide_mould_items").leftJoin("category", "divide_mould_items.category_id", "category.id").where("divide_mould_id", data.id).select("divide_mould_items.*", "category.category_name as category");
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
        res.render("dashboard/divide-mould-entry", params);
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

    items.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
      } else {
        item.id = uuid.v4();
        item.divide_mould_id = data.id;
      }
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let code: any = {
          id: uuid.v4(),
          divide_mould_item_id: item.id,
          category_id: item.category_id,
          wgt_gm: item.wgt_gm,
          goldrate: data.goldrate,
          code: item.code,
          status: "divide_mould",
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
    delete data.total_wgt_gm;
    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    let db = RestApi.getDb("divide_mould");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    db = db.where({ id: data.id });
    RestApi.getDb("divide_mould")
      .leftJoin("purchase", "purchase_id", "purchase.id")
      .where("divide_mould.id", data.id)
      .select("divide_mould.*", "purchase.mo_gm_balance")
      .then((result) => {
          const mould_wgt_gm = result[0].mo_gm_balance + Number(result[0].mould_wgt_gm) - Number(data.mould_wgt_gm);
          query.push(RestApi.getDb("purchase").where("id", result[0].purchase_id).update({ mo_gm_balance: mould_wgt_gm, updateddate: updatdate }, "id"));
          return db.update(data, "id");
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
        return RestApi.getDb("divide_mould_items").where("divide_mould_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("divide_mould_items", item_arr);
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
    RestApi.getDb("divide_mould_items")
      .where("divide_mould_id", data.id)
      .delete()
      .then((result) => {
        return RestApi.getDb("divide_mould").where({ id: data.id }).delete("id");
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

export default new DivideMouldRouter();