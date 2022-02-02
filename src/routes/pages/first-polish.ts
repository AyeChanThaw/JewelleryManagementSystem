/**
 * First Polish Routes
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

class FirstPolishRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/first-polish").all(Permission.onLoad).get(this.getList);
    this.route("/first-polish/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/first-polish/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/first-polish/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/first-polish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/first-polish", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/first-polish/entry", params: {}, listUrl: "/first-polish" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/first-polish-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/first-polish-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const updatdate = Utils.toSqlDate(new Date());
    const query: any = [];
    if (data.isfinished == 1) {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "first_polish", "use_status": "no-use", updateddate: updatdate }, "id"));
    } else {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
    }

    RestApi.getDb("first_polish").insert(data, "id")
      .then((result) => {
        return RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).select().first();
      })
      .then((result) => {
        let goldrate = "";
        if (result.goldrate == "a") {
          goldrate = "py_16";
        } else if (result.goldrate == "b") {
          goldrate = "py_15";
        } else if (result.goldrate == "c") {
          goldrate = "py_14";
        } else if (result.goldrate == "d") {
          goldrate = "py_13";
        }
        query.push(RestApi.getDb("stock").decrement(goldrate, data.reduce_wgt_gm));
        return Promise.all(query);
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
    const postUrl = `/first-polish/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/first-polish" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("first_polish")
      .where({ "first_polish.id": data.id })
      .select()
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
        res.render("dashboard/first-polish-entry", params);
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
    const updatdate = Utils.toSqlDate(new Date());
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

    query.push(RestApi.getDb("stock").decrement(gold_rate, data.reduce_wgt_gm));

    let db = RestApi.getDb("first_polish");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });

    RestApi.getDb("first_polish")
      .leftJoin("goldsmith_code", "goldsmith_code_id", "goldsmith_code.id")
      .where("first_polish.id", data.id)
      .select("first_polish.*", "goldsmith_code.goldrate")
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
        query.push(RestApi.getDb("stock").increment(goldrate, result.reduce_wgt_gm));
        if (data.isfinished == 1) {
          query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "first_polish", "use_status": "no-use", updateddate: updatdate }, "id"));
          if (result.goldsmith_code_id != data.goldsmith_code_id) {
            query.push(RestApi.getDb("goldsmith_code").where("id", result.goldsmith_code_id).update({ "status": "get_goldsmith", "use_status": "no-use", updateddate: updatdate }, "id"));
          }
        } else {
          if (result.goldsmith_code_id != data.goldsmith_code_id) {
            query.push(RestApi.getDb("goldsmith_code").where("id", result.goldsmith_code_id).update({ "status": "get_goldsmith", "use_status": "no-use", updateddate: updatdate }, "id"));
          }
          query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
        }
        if (query.length > 0)
          return Promise.all(query);
        else
          return undefined;
      })
      .then((result) => {
        return db.update(data, "id");
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
    const query: any = [];
    RestApi.getDb("first_polish")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        let goldrate = "";
        if (result.goldrate == "a") {
          goldrate = "py_16";
        } else if (result.goldrate == "b") {
          goldrate = "py_15";
        } else if (result.goldrate == "c") {
          goldrate = "py_14";
        } else if (result.goldrate == "d") {
          goldrate = "py_13";
        }
        query.push(RestApi.getDb("stock").increment(goldrate, result.reduce_wgt_gm));
        query.push(RestApi.getDb("goldsmith_code").where("id", result.goldsmith_code_id).update({ "use_status": "no-use", updateddate: Utils.toSqlDate(new Date()) }, "id"));
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("first_polish").where({ id: data.id }).delete("id");
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

export default new FirstPolishRouter();