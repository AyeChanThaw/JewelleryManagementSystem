/**
 * Bank Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class BankRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/bank").all(Permission.onLoad).get(this.getList);
    this.route("/bank/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/bank/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/bank/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/bank", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/bank", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/bank/entry", params: {}, listUrl: "/bank" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/bank-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/bank-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();

    const db = RestApi.getDb("bank");
    db.insert(data, "id")
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
    const postUrl = `/bank/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/bank" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("bank").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/bank-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("bank");
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

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("bank");
    db = db.where({ id: data.id });
    let dailycash_payment: any = [];
    let salegold_payment: any = [];
    let salediamond_payment: any = [];
    let order_payment: any = [];
    RestApi.getDb("daily_cash_payment")
      .where("bank_id", data.id)
      .select()
      .then((result) => {
        dailycash_payment = result;
        return RestApi.getDb("sale_gold_payment").where("bank_id", data.id).select();
      })
      .then((result) => {
        salegold_payment = result;
        return RestApi.getDb("sale_diamond_payment").where("bank_id", data.id).select();
      })
      .then((result) => {
        salediamond_payment = result;
        return RestApi.getDb("order_payment").where("bank_id", data.id).select();
      })
      .then((result) => {
        order_payment = result;
        if (dailycash_payment.length > 0 || salegold_payment.length > 0 || salediamond_payment.length > 0 || order_payment.length > 0) {
          throw new Error("Can not Delete. Already Used.");
        } else {
          return db.delete("id");
        }
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

export default new BankRouter();