/**
 * Give Diamond Routes
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

class GiveDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/give-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/give-diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/give-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/give-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/give-diamond/preview/:id").all(Permission.onLoad).get(this.getDetail);
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
          res.render("dashboard/give-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/give-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/give-diamond/entry", params: {}, listUrl: "/give-diamond" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    if (typeof (<any>req).jwtToken == "function") {
        (<any>req).jwtToken(jwtCredentialId)
          .then((result: string) => {
            params.token = result;
            params.params.date = moment(new Date()).format("DD/MM/YYYY");
            params.item_array = [];
            res.render("dashboard/give-diamond-entry", params);
          })
          .catch((err: any) => {
            next(err);
          });
      } else {
        res.render("dashboard/give-diamond-entry", params);
      }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const total_diamond_gm = data.total_diamond_ct / 5;
    data.total_diamond_gm = total_diamond_gm.toFixed(2);
    data.total_wgt_gm = Number(data.total_diamond_gm) + Number(data.wgt_gm);
    const item_array = JSON.parse(data.item_array);
    const updatdate = Utils.toSqlDate(new Date());
    const item_arr: any = [];
    const item_diamond_arr: any = [];
    const query: any = [];

    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.give_diamond_id = data.id;
      item = comfunc.fillDefaultFields(item);
      query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).decrement("current_qty", item.qty));
      item_arr.push(item);
    });
    if (data.isfinished == 1) {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "give_diamond", "use_status": "no-use", updateddate: updatdate }, "id"));
    } else {
      query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
    }

    delete (data.item_array);

    RestApi.getDb("goldsmith_code")
      .where("id", data.goldsmith_code_id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          if (data.isfinished == 1) {
            if (item_arr.length > 0) {
              item_arr.forEach((item: any) => {
                let item_diamond: any = {
                  id: uuid.v4(),
                  item_id: result.item_id,
                  diamond_item_id: item.diamond_id,
                  qty: item.qty
                };
                item_diamond = comfunc.fillDefaultFields(item_diamond);
                item_diamond_arr.push(item_diamond);
              });
            }
          }
        }
        if (item_diamond_arr.length > 0) {
          return RestApi.getKnex().batchInsert("item_diamonds", item_diamond_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("give_diamond").insert(data, "id");
      })
      .then((result) => {
        // if (data.isfinished == 1) {
        //   return RestApi.getDb("give_diamond_items").leftJoin("give_diamond", "give_diamond_items.give_diamond_id", "give_diamond.id").where("give_diamond.goldsmith_code_id", data.goldsmith_code_id).whereNot("give_diamond.id", data.id).select()
        // }
        if (query.length > 0)
          return Promise.all(query);
        else
          return undefined;
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_diamond_items", item_arr);
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
    const postUrl = `/give-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/give-diamond" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("give_diamond")
      .where({ "give_diamond.id": data.id })
      .select()
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("give_diamond_items").leftJoin("whole_diamond", "give_diamond_items.wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_diamond_items.diamond_id", "diamond_items.id").where("give_diamond_id", data.id).select("give_diamond_items.*", "whole_diamond.code as wholediamond", "diamond_items.code as diamond");
      })
      .then((result) => {
        params.item_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-diamond-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    const total_diamond_gm = data.total_diamond_ct / 5;
    data.total_diamond_gm = total_diamond_gm.toFixed(2);
    data.total_wgt_gm = Number(data.total_diamond_gm) + Number(data.wgt_gm);
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    const item_array = JSON.parse(data.item_array);
    data.updateddate = Utils.toSqlDate(new Date());
    const updatdate = Utils.toSqlDate(new Date());
    const item_arr: any = [];
    const item_diamond_arr: any = [];
    const query: any = [];

    item_array.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.wholediamond;
        delete item.diamond;
      } else {
        item.id = uuid.v4();
        item.give_diamond_id = data.id;
      }
      item.give_diamond_id = data.id;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });
    if (data.isfinished == 1) {
      item_arr.forEach((item: any) => {
        query.push(RestApi.getDb("goldsmith_code").where("id", data.goldsmith_code_id).update({ "status": "give_diamond", updateddate: updatdate }, "id"));
      });
    }
    delete data.item_array;

    let db = RestApi.getDb("give_diamond");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("goldsmith_code")
      .where("id", data.goldsmith_code_id)
      .select()
      .first()
      .then((result) => {
        if (result && result != "") {
          if (data.isfinished == 1) {
            if (item_arr.length > 0) {
              item_arr.forEach((item: any) => {
                let item_diamond: any = {
                  id: uuid.v4(),
                  item_id: result.item_id,
                  diamond_item_id: item.diamond_id,
                  qty: item.qty
                };
                item_diamond = comfunc.fillDefaultFields(item_diamond);
                item_diamond_arr.push(item_diamond);
              });
            }
          }
        }
        if (item_diamond_arr.length > 0) {
          return RestApi.getKnex().batchInsert("item_diamonds", item_diamond_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("give_diamond_items").where("give_diamond_id", data.id).select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).increment("current_qty", item.qty));
          });
        }
        return RestApi.getDb("give_diamond_items").where("give_diamond_id", data.id).delete();
      })
      .then((result) => {
        if (item_arr.length > 0) {
            item_arr.forEach((item: any) => {
              query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).decrement("current_qty", item.qty));
            });
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_diamond_items", item_arr);
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
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("give_diamond_items")
      .where("give_diamond_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).increment("current_qty", item.qty));
          });
        }
        if (query.length > 0) {
            return Promise.all(query);
        } else {
            return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("give_diamond_items").where("give_diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("give_diamond").where({ id: data.id }).delete("id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const id = data.id;

    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/give-diamond/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("give_diamond")
      .leftJoin("goldsmith", "give_diamond.goldsmith_id", "goldsmith.id")
      .leftJoin("category", "give_diamond.category_id", "category.id")
      .leftJoin("goldsmith_code", "goldsmith_code_id", "goldsmith_code.id")
      .where("give_diamond.id", data.id)
      .select("give_diamond.*", "goldsmith.goldsmith_name", "category.category_name", "goldsmith_code.code")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("give_diamond_items").leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_diamond_items.diamond_id", "diamond_items.id").where({ "give_diamond_id": data.id }).select("give_diamond_items.*", "diamond_items.code as item_code", "whole_diamond.code as wholediamond_code")
      })
      .then((result) => {
        params.item_array = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-diamond-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new GiveDiamondRouter();