/**
 * Return Items
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class ReturnItemRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/return-items").all(Permission.onLoad).get(this.getList);
    this.route("/return-items-production").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/return-items/goldsmith/:id").all(Permission.onLoad).post(this.postGoldsmith);
    this.route("/return-items/polish/:id").all(Permission.onLoad).post(this.postPolish);
    this.route("/return-items/boil/:id").all(Permission.onLoad).post(this.postBoil);
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
          res.render("dashboard/return-item", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-item", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/return-items-production", params: {}, listUrl: "/return-items-production" };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/return-item-production", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-item-production", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    if (typeof data.item_id == "object") {
      data.item_id.forEach((item: any) => {
        const check = "check_" + item;
        if (data[check]) {
          query.push(RestApi.getDb("return_items").where("id", item).update({ "is_production": 0, "showroom_date": date }));
        }
      });
    } else {
      const check = "check_" + data.item_id;
      if (data[check]) {
        query.push(RestApi.getDb("return_items").where("id", data.item_id).update({ "is_production": 0, "showroom_date": date }));
      }  
    }
    
    if (query.length > 0) {
      Promise.all(query)
        .then((result) => {
          console.log("promise result ", result);
          res.json({ "success": result });
        })
        .catch((err) => {
          res.json({ "error": err });
        })
    } else {
      res.json({ "success": "No Data" });
    }
  }

  public postGoldsmith(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_items")
      .where("id", data.id)
      .update({"is_active": 0, "status": "goldsmith", "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date())})
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postPolish(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_items")
      .where("id", data.id)
      .update({"is_active": 0, "status": "polish", "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date())})
      .then((result) => {
        return RestApi.getDb("return_goldsmith").where("return_item_id", data.id).update({"is_polish": 1, "updateddate": Utils.toSqlDate(new Date())});
      })
      .then((result) => {
        res.json({ "success": data });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postBoil(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_items")
      .where("id", data.id)
      .update({"is_active": 0, "status": "boil", "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date())})
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new ReturnItemRouter();