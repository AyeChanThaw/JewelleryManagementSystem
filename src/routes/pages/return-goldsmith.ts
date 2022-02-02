/**
 * Return Goldsmith
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

class ReturnGoldsmithRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/return-goldsmith").all(Permission.onLoad).get(this.getList);
    this.route("/return-goldsmith/undo/:id").all(Permission.onLoad).post(this.postUndo);
    this.route("/return-goldsmith/entry/:id").all(Permission.onLoad).get(this.getEntry);
    this.route("/return-goldsmith/entry").all(Permission.onLoad).post(this.postEntry);
    this.route("/return-goldsmith/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/return-goldsmith/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/return-goldsmith-finish").all(Permission.onLoad).get(this.getFinish);
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
          res.render("dashboard/return-goldsmith", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-goldsmith", params);
    }
  }

  public postUndo(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_items")
      .where("id", data.id)
      .update({"is_active": 1, "status": "", "updateddate": Utils.toSqlDate(new Date())})
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/return-goldsmith/entry", params: {}, listUrl: "/return-goldsmith" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "RTD";
    const count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("return_items")
      .where("id", id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          params.params.return_item_id = id;
          params.params.return_item_code = result.code;
          params.params.item_wgt_gm = result.wgt_gm;
          params.params.goldrate = result.goldrate;
        }

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        res.render("dashboard/return-goldsmith-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    delete data.return_item_code;
    RestApi.getDb("return_goldsmith")
      .insert(data, "id")
      .then((result) => {
        let gold_rate = "";
        if (data.goldrate && data.goldrate != "") {
          if (data.goldrate == "a") {
            gold_rate = "py_16";
          } else if (data.goldrate == "b") {
            gold_rate = "py_15";
          } else if (data.goldrate == "c") {
            gold_rate = "py_14";
          } else if (data.goldrate == "d") {
            gold_rate = "py_13";
          }
          return RestApi.getDb("stock").decrement(gold_rate, data.pay_wgt_gm);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("return_items").where("id", data.return_item_id).update({"use_status": "used", "updateddate": Utils.toSqlDate(new Date())});
      })
      .then((result) => {
        res.json({ "success": data });
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
    const postUrl = `/return-goldsmith/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/return-goldsmith-finish" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_goldsmith")
      .leftJoin("return_items", "return_item_id", "return_items.id")
      .where({ "return_goldsmith.id": data.id })
      .select("return_goldsmith.*", "return_items.code as return_item_code")
      .then((result) => {
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
        res.render("dashboard/return-goldsmith-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    const date = Utils.toSqlDate(new Date);
    const query: any = [];
    delete (data.return_item_code);
    let db = RestApi.getDb("return_goldsmith");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("return_goldsmith")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        let gold_rate = "";
        if (result && result != "") {
          if (result.goldrate && result.goldrate != "") {
            if (result.goldrate == "၁၆ ပဲရည်") {
              result.goldrate = "a";
              gold_rate = "py_16";
            } else if (result.goldrate == "၁၅ ပဲရည်") {
              result.goldrate = "b";
              gold_rate = "py_15";
            } else if (result.goldrate == "၁၄ ပဲရည်") {
              result.goldrate = "c";
              gold_rate = "py_14";
            } else if (result.goldrate == "၁၃ ပဲရည်") {
              result.goldrate = "d";
              gold_rate = "py_13";
            }
            query.push(RestApi.getDb("stock").increment(gold_rate, result.pay_wgt_gm));
          }
        }
        query.push(RestApi.getDb("stock").decrement(gold_rate, data.pay_wgt_gm));
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        res.json({ "success": data });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_goldsmith")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          if (result.goldrate && result.goldrate != "") {
            if (result.goldrate == "a") {
              query.push(RestApi.getDb("stock").increment("py_16", result.pay_wgt_gm));
            } else if (result.goldrate == "b") {
              query.push(RestApi.getDb("stock").increment("py_15", result.pay_wgt_gm));
            } else if (result.goldrate == "c") {
              query.push(RestApi.getDb("stock").increment("py_14", result.pay_wgt_gm));
            } else if (result.goldrate == "d") {
              query.push(RestApi.getDb("stock").increment("py_13", result.pay_wgt_gm));
            }
          }
          query.push(RestApi.getDb("return_items").where("id", result.return_item_id).update({ "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date()) }));
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
           return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("return_goldsmith").where({ id: data.id }).delete("id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getFinish(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/return-goldsmith-finish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-goldsmith-finish", params);
    }
  }
}

export default new ReturnGoldsmithRouter();