/**
 * Category Routes
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

class CategoryRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/category").all(Permission.onLoad).get(this.getList);
    this.route("/category/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/category/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/category/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/category", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/category", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/category/entry", params: {}, listUrl: "/category" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/category-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/category-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();

    const db = RestApi.getDb("category");
    const autogenerate: any = [];
    const pt: any = {
      id: uuid.v4(),
      tablename: "purchase_pt_code",
      prefix: "PT"+data.category_code,
      currentvalue: 0,
      lastdate: Utils.toGeneratecodeDate(new Date()),
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    };
    autogenerate.push(pt);
    const dividemould: any = {
      id: uuid.v4(),
      tablename: "divide_mould",
      prefix: "M"+data.category_code,
      currentvalue: 0,
      lastdate: Utils.toGeneratecodeDate(new Date()),
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    }
    autogenerate.push(dividemould);
    const ordermould: any = {
      id: uuid.v4(),
      tablename: "order_mould",
      prefix: data.category_code,
      currentvalue: 0,
      lastdate: Utils.toGeneratecodeDate(new Date()),
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    }
    autogenerate.push(ordermould);
    db.insert(data, "id")
      .then((result) => {
        return RestApi.getKnex().batchInsert("autogenerate", autogenerate);
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
    const postUrl = `/category/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/category" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("category").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/category-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const id = data.id;
    let db = RestApi.getDb("category");
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    RestApi.getDb("category")
      .where("id", id)
      .select()
      .then((result) => {
        const pt_prefix = "PT" + result[0].category_code;
        const dividemould_prefix = "M" + result[0].category_code;
        const ordermould_prefix = result[0].category_code;
        query.push(RestApi.getDb("autogenerate").where("prefix", pt_prefix).update({"prefix": "PT"+data.category_code}));
        query.push(RestApi.getDb("autogenerate").where("prefix", dividemould_prefix).update({"prefix": "M"+data.category_code}));
        query.push(RestApi.getDb("autogenerate").where("prefix", ordermould_prefix).update({"prefix": data.category_code}));
        return Promise.all(query);
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
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("category");
    db = db.where({ id: data.id });
    RestApi.getDb("item")
      .where("category_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          throw new Error("Can not Delete. Already Used.");
        } else {
          return RestApi.getDb("category").where("id", data.id).select();
        }
      })
      .then((result) => {
        const pt_prefix = "PT"+result[0].category_code;
        const dividemould_prefix = "M"+result[0].category_code;
        const ordermould_prefix = result[0].category_code;
        query.push(RestApi.getDb("autogenerate").where("prefix", pt_prefix).delete());
        query.push(RestApi.getDb("autogenerate").where("prefix", dividemould_prefix).delete());
        query.push(RestApi.getDb("autogenerate").where("prefix", ordermould_prefix).delete());
        return Promise.all(query);
      })
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

export default new CategoryRouter();