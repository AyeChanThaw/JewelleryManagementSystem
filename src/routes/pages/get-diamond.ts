/**
 * Get Diamond
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

class GetDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/get-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/get-diamond/entry/:id").all(Permission.onLoad).get(this.getEntry);
    this.route("/get-diamond/entry").all(Permission.onLoad).post(this.postEntry);
    this.route("/get-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/get-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/get-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/get-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/get-diamond/entry", params: {}, listUrl: "/get-diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("give_diamond")
        .leftJoin("goldsmith_code", "give_diamond.goldsmith_code_id", "goldsmith_code.id")
        .where("give_diamond.id", id)
        .select("give_diamond.*", "goldsmith_code.goldrate")
        .first()
        .then((result) => {
            params.params.diamond_wgt_gm = result.total_diamond_gm;
            params.params.give_diamond_id = id;
            params.params.goldsmith_code_id = result.goldsmith_code_id;
            params.params.category_id = result.category_id;
            params.params.goldsmith_id = result.goldsmith_id;
            params.params.pay_wgt_gm = result.total_wgt_gm;
            if (result.goldrate == "a")
              params.params.goldrate = "၁၆ ပဲရည်";
            else if (result.goldrate == "b")
              params.params.goldrate = "၁၅ ပဲရည်";
            else if (result.goldrate == "c")
              params.params.goldrate = "၁၄ ပဲရည်";
            else if (result.goldrate == "d")
              params.params.goldrate = "၁၃ ပဲရည်";
            params.params.date = moment(new Date()).format("DD/MM/YYYY");

          return RestApi.getKnex().raw(`SELECT SUM(qty) AS diamond_qty FROM give_diamond_items
                    WHERE give_diamond_id = '` + id + `'`);

        })
        .then((result) => {
          params.params.diamond_qty = result[0][0].diamond_qty;
          if (typeof (<any>req).jwtToken == "function") {
            return (<any>req).jwtToken(jwtCredentialId);
          } else {
            return Promise.resolve("");
          }
        })
        .then((result) => {
            params.token = result;
            res.render("dashboard/get-diamond-entry", params);
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
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "get_diamond", "use_status": "no-use", updateddate: updatdate }, "id"));
      query.push(RestApi.getDb("item").where("id", data.item_id).update({"diamond_qty": data.diamond_qty, "image": data.image, "status": "diamond", "updateddate": updatdate}, "id"));
    } else {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
    }
    if (!data.get_wgt_gm) {
      data.get_wgt_gm = 0;
    }
    let goldrate;
    if (data.goldrate == "၁၆ ပဲရည်") {
      data.goldrate = "a";
      goldrate = "py_16";
    } else if (data.goldrate == "၁၅ ပဲရည်") {
      data.goldrate = "b";
      goldrate = "py_15";
    } else if (data.goldrate == "၁၄ ပဲရည်") {
      data.goldrate = "c";
      goldrate = "py_14";
    } else if (data.goldrate == "၁၃ ပဲရည်") {
      data.goldrate = "d";
      goldrate = "py_13";
    }
    query.push(RestApi.getDb("stock").increment(goldrate, data.get_wgt_gm));
    RestApi.getDb("get_diamond").insert(data, "id")
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
    const postUrl = `/get-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/get-diamond" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("get_diamond")
      .where({ "get_diamond.id": data.id })
      .select()
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        if (result[0].goldrate == "a")
          params.params.goldrate = "၁၆ ပဲရည်";
        else if (result[0].goldrate == "b")
          params.params.goldrate = "၁၅ ပဲရည်";
        else if (result[0].goldrate == "c")
          params.params.goldrate = "၁၄ ပဲရည်";
        else if (result[0].goldrate == "d")
          params.params.goldrate = "၁၃ ပဲရည်";
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/get-diamond-entry", params);
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
    if (!data.get_wgt_gm) {
      data.get_wgt_gm = 0;
    }
    let goldrate = "";
    if (data.goldrate == "၁၆ ပဲရည်") {
      data.goldrate = "a";
      goldrate = "py_16";
    } else if (data.goldrate == "၁၅ ပဲရည်") {
      data.goldrate = "b";
      goldrate = "py_15";
    } else if (data.goldrate == "၁၄ ပဲရည်") {
      data.goldrate = "c";
      goldrate = "py_14";
    } else if (data.goldrate == "၁၃ ပဲရည်") {
      data.goldrate = "d";
      goldrate = "py_13";
    }
    query.push(RestApi.getDb("stock").increment(goldrate, data.get_wgt_gm));

    let db = RestApi.getDb("get_diamond");
    if (Utils.isEmpty(data.id)) {
        return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("get_diamond")
      .leftJoin("goldsmith_code", "goldsmith_code_id", "goldsmith_code.id")
      .where("get_diamond.id", data.id)
      .select("get_diamond.get_wgt_gm", "get_diamond.goldsmith_code_id", "goldsmith_code.category_id")
      .first()
      .then((result) => {
        query.push(RestApi.getDb("stock").decrement(goldrate, result.get_wgt_gm));
        if (data.isfinished == 1) {
          query.push(RestApi.getDb("goldsmith_code").where("id", result.goldsmith_code_id).update({ "status": "get_diamond", "use_status": "no-use", updateddate: updatdate }, "id"));
          query.push(RestApi.getDb("item").where("id", data.item_id).update({"diamond_qty": data.diamond_qty, "image": data.image, "status": "diamond", "updateddate": updatdate}, "id"));
        }
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
    RestApi.getDb("get_diamond")
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
}

export default new GetDiamondRouter();