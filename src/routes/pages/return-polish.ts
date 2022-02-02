/**
 * Return Polish
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

class ReturnPolishRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/return-polish").all(Permission.onLoad).get(this.getList);
    this.route("/return-polish/undo/:id").all(Permission.onLoad).post(this.postUndo);
    this.route("/return-polish/entry/:id").all(Permission.onLoad).get(this.getEntry);
    this.route("/return-polish/entry").all(Permission.onLoad).post(this.postEntry);
    this.route("/return-polish/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/return-polish/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/return-polish-finish").all(Permission.onLoad).get(this.getFinish);
    this.route("/return-polish/counter/:id").all(Permission.onLoad).get(this.getCounter).post(this.postCounter);
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
          res.render("dashboard/return-polish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-polish", params);
    }
  }

  public postUndo(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_goldsmith")
        .where("return_item_id", data.id)
        .select()
        .first()
        .then((result) => {
            if (result && result != "") {
                query.push(RestApi.getDb("return_items").where("id", data.id).update({"status": "goldsmith", "use_status": "used", "updateddate": date}));
                query.push(RestApi.getDb("return_goldsmith").where("id", result.id).update({"is_polish": 0, "updateddate": date}));
            } else {
                query.push(RestApi.getDb("return_items").where("id", data.id).update({"is_active": 1, "status": "", "use_status": "no-use", "updateddate": date}));
            }
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

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/return-polish/entry", params: {}, listUrl: "/return-polish" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("return_items")
      .where("id", id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          params.params.return_item_code = result.code;
          params.params.return_item_id = result.id;
          params.params.item_wgt_gm = result.wgt_gm;
          params.params.goldrate = result.goldrate;
        }
        return RestApi.getDb("return_goldsmith").where("return_item_id", id).select().first();
      })
      .then((result) => {
        if (result && result != "") {
            params.params.return_goldsmith_id = result.id;
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
        res.render("dashboard/return-polish-entry", params);
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
    delete data.return_item_code;
    RestApi.getDb("return_polish")
      .insert(data, "id")
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
    const postUrl = `/return-polish/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/return-polish-finish" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_polish")
      .leftJoin("return_items", "return_item_id", "return_items.id")
      .where({ "return_polish.id": data.id })
      .select("return_polish.*", "return_items.code as return_item_code")
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
        res.render("dashboard/return-polish-entry", params);
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
    let db = RestApi.getDb("return_polish");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    db.update(data, "id")
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
    RestApi.getDb("return_polish")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          return RestApi.getDb("return_items").where("id", result.return_item_id).update({ "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date()) });
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("return_polish").where({ id: data.id }).delete("id");
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
          res.render("dashboard/return-polish-finish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-polish-finish", params);
    }
  }

  public getCounter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const postUrl = `/return-polish/counter/${id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: {}, listUrl: "/return-polish-finish" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_polish")
      .leftJoin("return_items", "return_item_id", "return_items.id")
      .where("return_polish.id", id)
      .select("return_polish.*", "return_items.category_id")
      .first()
      .then((result) => {
        params.params.id = result.id;
        params.params.return_item_id = result.return_item_id;
        params.params.return_polish_id = result.id;
        params.params.category_id = result.category_id;
        params.params.goldrate = result.goldrate;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.params.wgt_gm = result.wgt_gm;
        params.params.image = result.image;

        return  RestApi.getDb("goldrate_price").orderBy("createddate", "desc").select().first();
      })
      .then((result) => {
        let current_rate = 0;
        if (params.params.goldrate == "a") {
          current_rate = result.a;
        } else if (params.params.goldrate == "b") {
          current_rate = result.b;
        } else if (params.params.goldrate == "c") {
          current_rate = result.c;
        } else {
          current_rate = result.d;
        }
        params.params.current_rate = current_rate;
        const price = Number(params.params.wgt_gm) * Number(params.params.current_rate);
        params.params.price = price;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/return-polish-counter", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postCounter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    let item: any = {};
    const diamond_items_arr: any = [];
    console.log("data ", data);
    RestApi.getDb("item")
      .leftJoin("return_items", "item.id", "return_items.item_id")
      .where({"return_items.id": data.return_item_id})
      .select("item.*", "return_items.type")
      .first()
      .then((result) => {
        const kpy = Utils.ChangeGmToKPY(data.wgt_gm);
        const kpy_string = kpy.split("-");
        item.id = uuid.v4();
        item.date = Utils.toSqlDate(new Date());
        item.code = data.code;
        item.count = data.count;
        item.price = data.price;
        item.item_name = data.item_name;
        item.wgt_gm = data.wgt_gm;
        item.wgt_k = kpy_string[0];
        item.wgt_p = kpy_string[1];
        item.wgt_y = kpy_string[2];
        // item.wgt_ct = result.wgt_ct;
        item.diamond_qty = result.diamond_qty;
        item.image = data.image;
        item.category_id = data.category_id;
        item.goldrate = data.goldrate;
        item.is_stock = 1;
        item.status = result.type;
        item = comfunc.fillDefaultFields(item);
        return RestApi.getDb("item_diamonds").where("item_id", result.id).select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((diamond_item) => {
            let diamond: any = {
              id: uuid.v4(),
              item_id: item.id,
              diamond_item_id: diamond_item.diamond_item_id,
              qty: diamond_item.qty
            };
            diamond = comfunc.fillDefaultFields(diamond);
            diamond_items_arr.push(diamond);
          });
        }
        if (diamond_items_arr.length > 0) {
          return RestApi.getKnex().batchInsert("item_diamonds", diamond_items_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("item").insert(item, "id");
      })
      .then((result) => {
        return RestApi.getDb("return_polish").where("id", data.return_polish_id).update({"is_place_counter": 1, "updateddate": Utils.toSqlDate(new Date())});
      })
      .then((result) => {
        res.json({ "success": item });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new ReturnPolishRouter();