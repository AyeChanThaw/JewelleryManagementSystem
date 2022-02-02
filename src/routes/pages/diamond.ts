/**
 * Diamond Routes
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

class DiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/diamond").all(Permission.onLoad).get(this.getList);
    this.route("/diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/diamond/entry", params: {}, listUrl: "/diamond" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "D";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("prefix", prefix)
      .select()
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue;
        }
        params.count = count;
        params.datecode = datecode;

        return RestApi.getDb("whole_diamond").where({"isfinished":  1, "is_stock": 1}).select("");
      })
      .then((result) => {
        const wholediamonds: any = [];
        result.forEach((wd) => {
          wholediamonds.push({label: wd.code, value: wd.id});
        });
        params.wholediamonds = wholediamonds;
        return RestApi.getDb("carat").select("");
      })
      .then((result) => {
        const carats: any = [];
        result.forEach((carat) => {
          carats.push({label: carat.carat, value: carat.id});
        });
        params.carats = carats;

        return RestApi.getDb("lonesee").select("");
      })
      .then((result) => {
        const lonesees: any = [];
        result.forEach((lonesee) => {
          lonesees.push({label: lonesee.lonesee, value: lonesee.id});
        });
        params.lonesees = lonesees;
        params.item_array = [];

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/diamond-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const prefix = "D";
    const count = data.count;
    const datecode = Utils.toGeneratecodeDate(new Date());
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const cur_date = Utils.toSqlDate(new Date());
    data.id = uuid.v4();
    delete (data.wholediamonds);
    delete (data.carats);
    delete (data.lonesees);
    delete (data.wholediamond);
    delete (data.gemtype);
    delete (data.count);
    const items = JSON.parse(data.item_array);
    const items_arr: any = [];
    const query: any = [];
    let total_carat = 0;
    items.forEach((item: any) => {
      item.id = uuid.v4();
      item = comfunc.fillDefaultFields(item);
      item.diamond_id = data.id;
      item.wholediamond_id = data.wholediamond_id;
      item.current_qty = item.qty;
      if (data.isfinished == 1)
        item.is_stock = 1;
      else
        item.is_stock = 0;
      items_arr.push(item);
      total_carat += Number(item.wgt_carat);
    });
    delete (data.item_array);
    RestApi.getDb("autogenerate")
      .where("prefix", "D")
      .update({ currentvalue: count, lastdate: datecode, updateddate: cur_date }, "id")
      .then((result) => {
        query.push(RestApi.getDb("whole_diamond").where("id", data.wholediamond_id).update({ "is_stock": 0, "updateddate": Utils.toSqlDate(new Date()) }, "id"));
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("diamond").insert(data, "id");
        // if (data.isfinished == 1) {
        //   query.push(RestApi.getDb("whole_diamond").where("id", data.wholediamond_id).update({ "is_stock": 0, "updateddate": cur_date }, "id"));
        //   query.push(RestApi.getDb("diamond").where("wholediamond_id", data.wholediamond_id).update({ "isfinished": 1, "updateddate": cur_date }, "id"));
        //   query.push(RestApi.getDb("diamond_items").where("wholediamond_id", data.wholediamond_id).update({ "is_stock": 1, "updateddate": cur_date }, "id"));
        //   return Promise.all(query);
        // }
        // else {
        //   return undefined;
        // }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("diamond_items", items_arr);
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

    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    const postUrl = `/diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("diamond")
      .leftJoin("whole_diamond", "diamond.wholediamond_id", "whole_diamond.id")
      .leftJoin("gemtype", "whole_diamond.gemtype_id", "gemtype.id")
      .where({ "diamond.id": data.id })
      .select("diamond.*", "whole_diamond.code as wholediamond", "gemtype.gemtype")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("diamond_items").leftJoin("carat", "diamond_items.carat_id", "carat.id").leftJoin("lonesee", "diamond_items.lonesee_id", "lonesee.id").where("diamond_id", data.id).select("diamond_items.*", "carat.carat", "lonesee.lonesee");
      })
      .then((result) => {
        params.item_array = result;
        // let current_total = 0;
        // if (result.length > 0) {
        //   result.forEach((item) => {
        //     current_total += Number(item.wgt_carat);
        //   });
        // }
        // params.current_total = current_total;

        return RestApi.getDb("autogenerate").where("prefix", "D").select();
      })
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue;
        }
        params.count = count;
        params.datecode = datecode;

        return RestApi.getDb("carat").select("");
      })
      .then((result) => {
        const carats: any = [];
        result.forEach((carat) => {
          carats.push({label: carat.carat, value: carat.id});
        });
        params.carats = carats;

        return RestApi.getDb("lonesee").select("");
      })
      .then((result) => {
        const lonesees: any = [];
        result.forEach((lonesee) => {
          lonesees.push({label: lonesee.lonesee, value: lonesee.id});
        });
        params.lonesees = lonesees;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/diamond-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    const count = data.count;
    const datecode = Utils.toGeneratecodeDate(new Date());
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const cur_date = Utils.toSqlDate(new Date());
    delete (data.carats);
    delete (data.lonesees);
    delete (data.wholediamond);
    delete (data.gemtype);
    delete (data.count);
    const items = JSON.parse(data.item_array);
    const items_arr: any = [];
    const query: any = [];
    let total_carat = 0;
    items.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete (item.carat);
        delete (item.lonesee);
        if (data.isfinished == 1)
          item.is_stock = 1;
        else
          item.is_stock = 0;
        item.createddate = Utils.toSqlDate(new Date);
        item.updateddate = Utils.toSqlDate(new Date);
      } else {
        item.id = uuid.v4();
        item = comfunc.fillDefaultFields(item);
        item.diamond_id = data.id;
        item.wholediamond_id = data.wholediamond_id;
        item.current_qty = item.qty;
        if (data.isfinished == 1)
          item.is_stock = 1;
        else
          item.is_stock = 0;
      }
      items_arr.push(item);
      total_carat += Number(item.wgt_carat);
    });
    delete (data.item_array);
    RestApi.getDb("autogenerate")
      .where("prefix", "D")
      .update({ currentvalue: count, lastdate: datecode, updateddate: cur_date }, "id")
      .then((result) => {
        return RestApi.getDb("diamond").where("id", data.id).update({ "remark": data.remark, "updateddate": cur_date }, "id");
      })
      .then((result) => {
        if (data.isfinished == 1) {
          query.push(RestApi.getDb("diamond").where("wholediamond_id", data.wholediamond_id).update({ "isfinished": 1, "updateddate": cur_date }, "id"));
          query.push(RestApi.getDb("diamond_items").where("wholediamond_id", data.wholediamond_id).update({ "is_stock": 1, "updateddate": cur_date }, "id"));
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("diamond_items").where("diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("diamond_items", items_arr);
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
    let db = RestApi.getDb("diamond");
    db = db.where({ id: data.id });
    RestApi.getDb("diamond_items")
      .where("diamond_id", data.id)
      .delete()
      .then((result) => {
        return db.delete("id");
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

export default new DiamondRouter();