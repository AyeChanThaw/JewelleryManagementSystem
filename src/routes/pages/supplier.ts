/**
 * Supplier Routes
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

class SupplierRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/supplier").all(Permission.onLoad).get(this.getList);
    this.route("/supplier/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/supplier/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/supplier/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/debt").all(Permission.onLoad).get(this.getDebt);
    this.route("/diamond-debt").all(Permission.onLoad).get(this.getDiamondDebt);
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
          res.render("dashboard/supplier", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/supplier", params);
    }
  }

  public getDebt(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/debt", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/debt", params);
    }
  }

  public getDiamondDebt(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/diamond-debt", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/diamond-debt", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/supplier/entry", params: {}, listUrl: "/supplier" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/supplier-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/supplier-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    console.log("data ", data);
    if (data.pay_usd == "" || data.pay_usd == undefined || data.pay_usd == null)
      data.pay_usd = 0;
    if (data.pay_mmk == "" || data.pay_mmk == undefined || data.pay_mmk == null)
      data.pay_mmk = 0;
    if (data.get == "" || data.get == undefined || data.get == null)
      data.get = 0;

    console.log("ori data ", data);
    const db = RestApi.getDb("supplier");
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
    const postUrl = `/supplier/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/supplier" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("supplier").where({ id: data.id }).select()
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
        res.render("dashboard/supplier-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    console.log("data ", data);
    if (data.pay_usd == "" || data.pay_usd == undefined || data.pay_usd == null)
      data.pay_usd = 0;
    if (data.pay_mmk == "" || data.pay_mmk == undefined || data.pay_mmk == null)
      data.pay_mmk = 0;
    if (data.get == "" || data.get == undefined || data.get == null)
      data.get = 0;

    let db = RestApi.getDb("supplier");
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
    let purchases: any = [];
    let wholediamonds: any = [];
    let goldraws: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("supplier");
    db = db.where({ id: data.id });
    RestApi.getDb("whole_diamond").where("supplier_id", data.id).select()
      .then((result) => {
        wholediamonds = result;
        return RestApi.getDb("purchase").where("supplier_id", data.id).select();
      })
      .then((result) => {
        purchases = result;
        return RestApi.getDb("goldraw").where("supplier_id", data.id).select();
      })
      .then((result) => {
        goldraws = result;
        if (wholediamonds.length > 0 || purchases.length > 0 || goldraws.length > 0) {
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

export default new SupplierRouter();