/**
 * Get Outside
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

class GetOutsideRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/get-outside").all(Permission.onLoad).get(this.getList);
    this.route("/get-outside/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/get-outside/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/get-outside/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/get-outside", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/get-outside", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/get-outside/entry", params: {}, listUrl: "/get-outside" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          // params.item_array = [];
          res.render("dashboard/get-outside-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/get-outside-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const updatdate = Utils.toSqlDate(new Date());
    const query: any = [];
    console.log("data orig ", data);
    if (data.isfinished == 1) {
      if (!data.get_wgt_gm) {
        data.get_wgt_gm = 0;
      }
      let goldrate;
      if (data.goldrate == "၁၆ ပဲရည်") {
        goldrate = "py_16";
        data.goldrate = "a";
      } else if (data.goldrate == "၁၅ ပဲရည်") {
        goldrate = "py_15";
        data.goldrate = "b";
      } else if (data.goldrate == "၁၄ ပဲရည်") {
        goldrate = "py_14";
        data.goldrate = "c";
      } else if (data.goldrate == "၁၃ ပဲရည်") {
        goldrate = "py_13";
        data.goldrate = "d";
      }
      if (data.get_wgt_gm > 0)
        query.push(RestApi.getDb("stock").increment(goldrate, data.get_wgt_gm));
      let item: any = {
        id: uuid.v4(),
        date: Utils.toSqlDate(new Date()),
        item_name: data.item_name,
        diamond_qty: data.diamond_qty,
        wgt_ct: data.diamond_wgt_ct,
        image: data.image,
        category_id: data.category_id,
        goldrate: data.goldrate,
        is_stock: 0,
        status: data.type
      };
      item = comfunc.fillDefaultFields(item);
      data.item_id = item.id;
      query.push(RestApi.getDb("item").insert(item, "id"));
    }
    query.push(RestApi.getDb("give_outside_items").where("id", data.give_outside_item_id).update({ "status": "used", "updateddate": updatdate }));
    // delete data.item_name;
    console.log("data next ", data);
    RestApi.getDb("get_outside").insert(data, "id")
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
    const postUrl = `/get-outside/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/get-outside" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("get_outside")
      .where({ "get_outside.id": data.id })
      .select("get_outside.*")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        console.log("data ", params.params);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/get-outside-entry", params);
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
    console.log("data orig ", data);
    if (data.isfinished == 1) {
      if (!data.get_wgt_gm) {
        data.get_wgt_gm = 0;
      }
      let goldrate;
      if (data.goldrate == "၁၆ ပဲရည်") {
        goldrate = "py_16";
        data.goldrate = "a";
      } else if (data.goldrate == "၁၅ ပဲရည်") {
        goldrate = "py_15";
        data.goldrate = "b";
      } else if (data.goldrate == "၁၄ ပဲရည်") {
        goldrate = "py_14";
        data.goldrate = "c";
      } else if (data.goldrate == "၁၃ ပဲရည်") {
        goldrate = "py_13";
        data.goldrate = "d";
      }
      if (data.get_wgt_gm > 0)
        query.push(RestApi.getDb("stock").increment(goldrate, data.get_wgt_gm));
      let item: any = {
        id: uuid.v4(),
        date: Utils.toSqlDate(new Date()),
        item_name: data.item_name,
        diamond_qty: data.diamond_qty,
        image: data.image,
        category_id: data.category_id,
        goldrate: data.goldrate,
        is_stock: 0,
        status: data.type
      };
      item = comfunc.fillDefaultFields(item);
      data.item_id = item.id;
      query.push(RestApi.getDb("item").insert(item, "id"));
    }
    // delete data.item_name;

    let db = RestApi.getDb("get_outside");
    if (Utils.isEmpty(data.id)) {
        return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    console.log("data next ", data);
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
    let give_outside: any = {};
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("get_outside")
      .where({ id: data.id })
      .select()
      .then((result) => {
        give_outside = result[0];
        return RestApi.getDb("item").where("id", give_outside.item_id).delete();
      })
      .then((result) => {
        return RestApi.getDb("give_outside_items").where("id", give_outside.give_outside_item_id).update({ "status": "no-use", "updateddate": Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("get_outside").where({ id: data.id }).delete("id");
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

export default new GetOutsideRouter();