/**
 * Gold Routes
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

class GoldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/gold").all(Permission.onLoad).get(this.getList);
    this.route("/gold/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/gold/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/gold/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/gold", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/gold", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/gold/entry", params: {}, listUrl: "/gold" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "G";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
        .where("prefix", prefix)
        .select()
        .then((result) => {
            if (result[0].lastdate == datecode) {
            count = result[0].currentvalue + 1;
            } else {
            count++;
            result[0].lastdate = datecode;
            }
            const voc_no = prefix + datecode + count;
            params.params.voc_no = voc_no;

            if (typeof (<any>req).jwtToken == "function") {
            return (<any>req).jwtToken(jwtCredentialId);
            } else {
            return Promise.resolve("");
            }
        })
        .then((result) => {
            params.token = result;
            res.render("dashboard/gold-entry", params);
        })
        .catch((err: any) => {
            next(err);
        });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    const prefix = "G";
    let count = 0;
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());

    if (data.finished) {
      RestApi.getDb("autogenerate")
      .select()
      .where("prefix", prefix)
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        data.voc_no = prefix + datecode + count;
        return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("gold").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("stock").select().first();
      })
      .then((stock) => {
        const gold_k = data.gold_k;
        const gold_p = data.gold_p;
        const gold_y = data.gold_y;
        const brass_k = data.brass_k;
        const brass_p = data.brass_p;
        const brass_y = data.brass_y;
        const silver_k = data.silver_k;
        const silver_p = data.silver_p;
        const silver_y = data.silver_y;
        const mo_k = data.mo_k;
        const mo_p = data.mo_p;
        const mo_y = data.mo_y;
        const gold_Gm: any = Utils.ChangeKPYToGm(gold_k, gold_p, gold_y).toFixed(2);
        const brass_Gm: any = Utils.ChangeKPYToGm(brass_k, brass_p, brass_y).toFixed(2);
        const silver_Gm: any = Utils.ChangeKPYToGm(silver_k, silver_p, silver_y).toFixed(2);
        const mo_Gm: any = Utils.ChangeKPYToGm(mo_k, mo_p, mo_y).toFixed(2);
        stock.gold_total_gm = (stock.gold_total_gm - gold_Gm).toFixed(2);
        stock.brass_total_gm = (stock.brass_total_gm - brass_Gm).toFixed(2);
        stock.silver_total_gm = (stock.silver_total_gm - silver_Gm).toFixed(2);
        stock.mo_total_gm = (stock.mo_total_gm - mo_Gm).toFixed(2);
        if (data.goldrate === "d") {
          stock.py_13 = stock.py_13 + parseFloat(data.net_gm);
        }
        else if (data.goldrate === "c") {
          stock.py_14 = stock.py_14 + parseFloat(data.net_gm);
        }
        else if (data.goldrate === "b") {
          stock.py_15 = stock.py_15 + parseFloat(data.net_gm);
        }
        else {
          stock.py_16 = stock.py_16 + parseFloat(data.net_gm);
        }
        return RestApi.getDb("stock").where({id: stock.id}).update(stock, "id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    } else {
      RestApi.getDb("autogenerate")
      .select()
      .where("prefix", prefix)
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        data.voc_no = prefix + datecode + count;
        return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("gold").insert(data, "id");
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

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/gold/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/gold" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("gold")
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
        res.render("dashboard/gold-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());

    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    if (data.finished) {
      RestApi.getDb("gold").where({id: data.id}).update(data, "id")
      .then((result) => {
        return RestApi.getDb("stock").select().first();
      })
      .then((stock) => {
        const gold_k = data.gold_k;
        const gold_p = data.gold_p;
        const gold_y = data.gold_y;
        const brass_k = data.brass_k;
        const brass_p = data.brass_p;
        const brass_y = data.brass_y;
        const silver_k = data.silver_k;
        const silver_p = data.silver_p;
        const silver_y = data.silver_y;
        const mo_k = data.mo_k;
        const mo_p = data.mo_p;
        const mo_y = data.mo_y;
        const gold_Gm: any = Utils.ChangeKPYToGm(gold_k, gold_p, gold_y).toFixed(2);
        const brass_Gm: any = Utils.ChangeKPYToGm(brass_k, brass_p, brass_y).toFixed(2);
        const silver_Gm: any = Utils.ChangeKPYToGm(silver_k, silver_p, silver_y).toFixed(2);
        const mo_Gm: any = Utils.ChangeKPYToGm(mo_k, mo_p, mo_y).toFixed(2);
        stock.gold_total_gm = (stock.gold_total_gm - gold_Gm).toFixed(2);
        stock.brass_total_gm = (stock.brass_total_gm - brass_Gm).toFixed(2);
        stock.silver_total_gm = (stock.silver_total_gm - silver_Gm).toFixed(2);
        stock.mo_total_gm = (stock.mo_total_gm - mo_Gm).toFixed(2);
        if (data.goldrate === "d") {
          stock.py_13 = stock.py_13 + parseFloat(data.net_gm);
        }
        else if (data.goldrate === "c") {
          stock.py_14 = stock.py_14 + parseFloat(data.net_gm);
        }
        else if (data.goldrate === "b") {
          stock.py_15 = stock.py_15 + parseFloat(data.net_gm);
        }
        else {
          stock.py_16 = stock.py_16 + parseFloat(data.net_gm);
        }
        return RestApi.getDb("stock").where({id: stock.id}).update(stock, "id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    } else {
      RestApi.getDb("gold").where({id: data.id}).update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    }
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("gold");
    db = db.where({ id: data.id });
    db.delete("id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new GoldRouter();