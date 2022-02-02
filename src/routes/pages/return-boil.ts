/**
 * Return Boil
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

class ReturnBoilRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/return-boil").all(Permission.onLoad).get(this.getList);
    this.route("/return-boil/undo/:id").all(Permission.onLoad).post(this.postUndo);
    this.route("/return-boil/entry/:id").all(Permission.onLoad).get(this.getEntry);
    this.route("/return-boil/entry").all(Permission.onLoad).post(this.postEntry);
    this.route("/return-boil/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/return-boil/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/return-boil-finish").all(Permission.onLoad).get(this.getFinish);
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
          res.render("dashboard/return-boil", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-boil", params);
    }
  }

  public postUndo(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_items")
      .where("id", data.id)
      .update({"is_active": 1, "status": "", "updateddate": Utils.toSqlDate(new Date())})
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
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/return-boil/entry", params: {}, listUrl: "/return-boil" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("return_items")
      .where("id", id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          params.params.return_item_code = result.code;
          params.params.return_item_id = result.id;
          params.params.type = result.type;
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
        res.render("dashboard/return-boil-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.is_set_diamond = data.is_set_diamond == "on" ? 1 : 0;
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    delete data.return_item_code;
    delete data.type;
    let gold_rate = "";
    if (data.goldrate == "a") {
      gold_rate = "py_16";
    } else if (data.goldrate == "b") {
      gold_rate = "py_15";
    } else if (data.goldrate == "c") {
      gold_rate = "py_14";
    } else if (data.goldrate == "d") {
      gold_rate = "py_13";
    }
    RestApi.getKnex()
      .raw(`SELECT * from item_diamonds
            WHERE EXISTS (
              SELECT item_id FROM return_items
              WHERE id = '` + data.return_item_id + `' AND return_items.item_id = item_diamonds.item_id
            )`)
      .then((result) => {
        if (result) {
          if (data.is_set_diamond == 1) {
            result[0].forEach((diamond: any) => {
              query.push(RestApi.getDb("diamond_items").where({ "id": diamond.diamond_item_id }).increment("current_qty", diamond.qty));
            });
          }
          query.push(RestApi.getDb("stock").increment(gold_rate, data.wgt_gm));
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("return_boil").insert(data, "id");
      })
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
    const postUrl = `/return-boil/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/return-boil-finish" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_boil")
      .leftJoin("return_items", "return_item_id", "return_items.id")
      .where({ "return_boil.id": data.id })
      .select("return_boil.*", "return_items.code as return_item_code", "return_items.type")
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
        res.render("dashboard/return-boil-entry", params);
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
    if (data.is_set_diamond == "on" || data.is_set_diamond == "1") {
      data.is_set_diamond = 1;
    }
    else {
      data.is_set_diamond = 0;
    }
    const query: any = [];
    let item_diamonds: any = [];
    delete (data.return_item_code);
    delete (data.type);
    let db = RestApi.getDb("return_boil");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getKnex()
      .raw(`SELECT * from item_diamonds
            WHERE EXISTS (
              SELECT item_id FROM return_items
              WHERE id = '` + data.return_item_id + `' AND return_items.item_id = item_diamonds.item_id
            )`)
      .then((result) => {
        item_diamonds = result[0];
        return RestApi.getDb("return_boil").where("id", data.id).select().first();
      })
      .then((result) => {
        if (result && result != "") {
          if (result.goldrate == "a") {
            query.push(RestApi.getDb("stock").decrement("py_16", result.wgt_gm));
          } else if (result.goldrate == "b") {
            query.push(RestApi.getDb("stock").decrement("py_15", result.wgt_gm));
          } else if (result.goldrate == "c") {
            query.push(RestApi.getDb("stock").decrement("py_14", result.wgt_gm));
          } else if (result.goldrate == "d") {
            query.push(RestApi.getDb("stock").decrement("py_13", result.wgt_gm));
          }
          if (result.is_set_diamond == 1) {
            if (data.is_set_diamond == 0) {
              item_diamonds.forEach((diamond: any) => {
                query.push(RestApi.getDb("diamond_items").where({ "id": diamond.diamond_item_id }).decrement("current_qty", diamond.qty));
              });
            }
          } else {
            if (data.is_set_diamond == 1) {
              item_diamonds.forEach((diamond: any) => {
                query.push(RestApi.getDb("diamond_items").where({ "id": diamond.diamond_item_id }).increment("current_qty", diamond.qty));
              });
            }
          }
        }
        if (data.goldrate == "a") {
          // gold_rate = "py_16";
          query.push(RestApi.getDb("stock").increment("py_16", data.wgt_gm));
        } else if (data.goldrate == "b") {
          // gold_rate = "py_15";
          query.push(RestApi.getDb("stock").increment("py_15", data.wgt_gm));
        } else if (data.goldrate == "c") {
          // gold_rate = "py_14";
          query.push(RestApi.getDb("stock").increment("py_14", data.wgt_gm));
        } else if (data.goldrate == "d") {
          // gold_rate = "py_13";
          query.push(RestApi.getDb("stock").increment("py_13", data.wgt_gm));
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return db.update(data, "id");
      })
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
    let boil_data: any = {};
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_boil")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        boil_data = result;
        query.push(RestApi.getDb("return_items").where("id", result.return_item_id).update({ "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date()) }));
        if (boil_data.goldrate == "a") {
          query.push(RestApi.getDb("stock").decrement("py_16", boil_data.wgt_gm));
        } else if (boil_data.goldrate == "b") {
          query.push(RestApi.getDb("stock").decrement("py_15", boil_data.wgt_gm));
        } else if (boil_data.goldrate == "c") {
          query.push(RestApi.getDb("stock").decrement("py_14", boil_data.wgt_gm));
        } else if (boil_data.goldrate == "d") {
          query.push(RestApi.getDb("stock").decrement("py_13", boil_data.wgt_gm));
        }
        return RestApi.getKnex()
          .raw(`SELECT * from item_diamonds
                WHERE EXISTS (
                  SELECT item_id FROM return_items
                  WHERE id = '` + boil_data.return_item_id + `' AND return_items.item_id = item_diamonds.item_id
                )`);
      })
      .then((result) => {
        if (boil_data.is_set_diamond == 1) {
          result[0].forEach((diamond: any) => {
            query.push(RestApi.getDb("diamond_items").where({ "id": diamond.diamond_item_id }).decrement("current_qty", diamond.qty));
          });
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("return_boil").where({ id: data.id }).delete("id");
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
          res.render("dashboard/return-boil-finish", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-boil-finish", params);
    }
  }
}

export default new ReturnBoilRouter();