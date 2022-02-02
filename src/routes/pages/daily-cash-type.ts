/**
 * Daily Cash Type Routes
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

class DailyCashTypeRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/daily-cash-type").all(Permission.onLoad).get(this.getList);
    this.route("/daily-cash-type/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/daily-cash-type/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/daily-cash-type/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/daily-cash-type", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-cash-type", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/daily-cash-type/entry", params: {}, listUrl: "/daily-cash-type" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/daily-cash-type-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-cash-type-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();

    const db = RestApi.getDb("daily_cash_type");
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
    const postUrl = `/daily-cash-type/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/daily-cash-type" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("daily_cash_type").where({ id: data.id }).select()
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
        res.render("dashboard/daily-cash-type-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.updateddate = Utils.toSqlDate(new Date());
    let db = RestApi.getDb("daily_cash_type");
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
    let daily_usage: any = [];
    let daily_usage_showroom: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("daily_cash_type");
    db = db.where({ id: data.id });
    RestApi.getDb("daily_usage")
      .where("daily_cash_type_id", data.id)
      .select()
      .then((result) => {
        daily_usage = result;
        return RestApi.getDb("daily_usage_showroom").where("daily_cash_type_id", data.id);
      })
      .then((result) => {
        daily_usage_showroom = result;
        if (daily_usage.length > 0 || daily_usage_showroom.length > 0) {
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

export default new DailyCashTypeRouter();