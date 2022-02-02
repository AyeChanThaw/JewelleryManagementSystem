/**
 * Polish
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

class PolishRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/polish").all(Permission.onLoad).get(this.getList);
    this.route("/polish/entry/:id").all(Permission.onLoad).get(this.getEntry);
    this.route("/polish/entry").all(Permission.onLoad).post(this.postEntry);
    this.route("/polish/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/polish/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/polish-finish").all(Permission.onLoad).get(this.getFinish);
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
          res.render("dashboard/polish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/polish", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/polish/entry", params: {}, listUrl: "/polish" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("get_diamond")
        .where("id", id)
        .select()
        .first()
        .then((result) => {
          if (result && result != "") {
            params.params.get_diamond_id = id;
            params.params.goldsmith_code_id = result.goldsmith_code_id;
            params.params.item_id = result.item_id;
            params.params.pay_wgt_gm = result.return_wgt_gm;
            return "";
          } else {
            return RestApi.getDb("get_goldsmith").where("id", id).select().first();
          }
        })
        .then((result) => {
          if (result && result != "") {
            params.params.get_goldsmith_id = id;
            params.params.goldsmith_code_id = result.goldsmith_code_id;
            params.params.item_id = result.item_id;
            params.params.pay_wgt_gm = result.wgt_gm;
            return "";
          } else {
            return RestApi.getDb("get_outside").where("id", id).select().first();
          }
        })
        .then((result) => {
          if (result && result != "") {
            params.params.get_outside_id = id;
            params.params.item_id = result.item_id;
            params.params.pay_wgt_gm = result.return_wgt_gm;
          }
          params.params.date = moment(new Date()).format("DD/MM/YYYY");

          if (typeof (<any>req).jwtToken == "function") {
              return (<any>req).jwtToken(jwtCredentialId);
          } else {
              return Promise.resolve("");
          }
        })
        .then((result) => {
            params.token = result;
            res.render("dashboard/polish-entry", params);
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
    const updatdate = Utils.toSqlDate(new Date());
    const query: any = [];
    if (data.isfinished == 1) {
      const kpy = Utils.ChangeGmToKPY(data.wgt_gm);
      const kpy_string = kpy.split("-");
      const k = kpy_string[0];
      const p = kpy_string[1];
      const y = kpy_string[2];
      query.push(RestApi.getDb("item").where("id", data.item_id).update({ "wgt_gm": data.wgt_gm, "wgt_k": k, "wgt_p": p, "wgt_y": y, "image": data.image, updateddate: updatdate }, "id"));
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "polish", "use_status": "no-use", updateddate: updatdate }, "id"));
      if (data.get_outside_id && data.get_outside_id != "") {
        query.push(RestApi.getDb("get_outside").where("id", data.get_outside_id).update("status", "polish"));
      }
    } else {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
    }
    RestApi.getDb("polish").insert(data, "id")
      .then((result) => {
        if (query.length > 0) {
            return Promise.all(query);
        } else {
            return data;
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

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/polish/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/polish" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("polish")
      .where({ "id": data.id })
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
        res.render("dashboard/polish-entry", params);
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
    if (data.isfinished == 1) {
      const kpy = Utils.ChangeGmToKPY(data.wgt_gm);
      const kpy_string = kpy.split("-");
      const k = kpy_string[0];
      const p = kpy_string[1];
      const y = kpy_string[2];
      query.push(RestApi.getDb("item").where("id", data.item_id).update({ "wgt_gm": data.wgt_gm, "wgt_k": k, "wgt_p": p, "wgt_y": y, "image": data.image, updateddate: updatdate }, "id"));
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "polish", "use_status": "no-use", updateddate: updatdate }, "id"));
    } else {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
    }
    let db = RestApi.getDb("polish");
    if (Utils.isEmpty(data.id)) {
        return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    db.update(data, "id")
      .then((result) => {
          if (query.length > 0) {
            return Promise.all(query);
          } else {
            return data;
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

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("polish")
      .where({ id: data.id })
      .delete("id")
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
          res.render("dashboard/polish-finish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/polish-finish", params);
    }
  }
}

export default new PolishRouter();