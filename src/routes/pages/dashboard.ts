/**
 * Dashboard Router
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import config from "../../../data/config.json";
import { Permission } from "../../lib/permission";
import * as RestApi from "../../lib/restapi";
import { Utils } from "../../lib/utils";
import moment from "moment";

const jwtCredentialId = config.jwt.defCredentialId;

class DashboardRouter extends ExpressRouter {
  constructor() {
    super();
    this.route("/dashboard").all(Permission.onLoad).get(this.getDashboard);
    this.route("/topcustomersreport").all(Permission.onLoad).get(this.getTopCustomersReport);
    this.route("/dailysalesreport").all(Permission.onLoad).get(this.getDailySalesReport);
    this.route("/goldsmithorderreport").all(Permission.onLoad).get(this.getGoldSmithOrderReport);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getDashboard(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    const fromnoformat = moment(new Date()).subtract(29, "days").toDate();
    const fromdate = moment(fromnoformat).format("DD/MM/YYYY");

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.fromdate = fromdate;
          res.render("dashboard/index", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/index", params);
    }
  }

  public getTopCustomersReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/topcustomersreport", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/topcustomersreport", params);
    }
  }

  public getDailySalesReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/dailysalesreport", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/dailysalesreport", params);
    }
  }

  public getGoldSmithOrderReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/goldsmithorderreport", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/goldsmithorderreport", params);
    }
  }
}

export default new DashboardRouter();