/**
 * Give Goldsmith Routes
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

class GiveGoldsmithRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/give-goldsmith").all(Permission.onLoad).get(this.getList);
    this.route("/give-goldsmith/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/give-goldsmith/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    // this.route("/get-goldsmith/edit/:id").all(Permission.onLoad).get(this.getGEdit).post(this.postGEdit);
    this.route("/give-goldsmith/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/give-goldsmith/preview/:id").all(Permission.onLoad).get(this.getDetail);
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
          res.render("dashboard/give-goldsmith", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/give-goldsmith", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/give-goldsmith/entry", params: {}, listUrl: "/give-goldsmith" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    if (typeof (<any>req).jwtToken == "function") {
        (<any>req).jwtToken(jwtCredentialId)
          .then((result: string) => {
            params.token = result;
            params.params.date = moment(new Date()).format("DD/MM/YYYY");
            params.item_array = [];
            res.render("dashboard/give-goldsmith-entry", params);
          })
          .catch((err: any) => {
            next(err);
          });
      } else {
        res.render("dashboard/give-goldsmith-entry", params);
      }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    const item_array = JSON.parse(data.item_array);
    const updatdate = Utils.toSqlDate(new Date());
    const item_arr: any = [];
    const real_item_arr: any = [];
    const query: any = [];
    let gold_rate = "";

    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.give_goldsmith_id = data.id;
      if (item.goldrate == "၁၆ ပဲရည်") {
        item.goldrate = "a";
        gold_rate = "py_16";
      } else if (item.goldrate == "၁၅ ပဲရည်") {
        item.goldrate = "b";
        gold_rate = "py_15";
      } else if (item.goldrate == "၁၄ ပဲရည်") {
        item.goldrate = "c";
        gold_rate = "py_14";
      } else if (item.goldrate == "၁၃ ပဲရည်") {
        item.goldrate = "d";
        gold_rate = "py_13";
      }
      item = comfunc.fillDefaultFields(item);
      query.push(RestApi.getDb("stock").decrement(gold_rate, item.pay_wgt_gm));
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let real_item: any = {
          id: uuid.v4(),
          date: Utils.toSqlDate(new Date()),
          goldsmith_id: data.goldsmith_id,
          item_name: item.item_name,
          category_id: item.category_id,
          goldrate: item.goldrate,
          is_stock: 0,
          status: "gold"
        };
        real_item = comfunc.fillDefaultFields(real_item);
        item.item_id = real_item.id;
        real_item_arr.push(real_item);
        query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "goldsmith_id": data.goldsmith_id, "item_id": real_item.id, "status": "give_goldsmith", "use_status": "no-use", updateddate: updatdate }, "id"));
        // query.push(RestApi.getDb("give_goldsmith_items").where("goldsmith_code_id", item.goldsmith_code_id).delete());
      } else {
        item.is_stock = 0;
        query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
      }
      item_arr.push(item);
    });
    // if (data.isfinished == 1) {
    //   item_arr.forEach((item: any) => {
    //     // query.push(RestApi.getDb("order_mould_items").where("id", item.order_mould_item_id).update({ "is_stock": 0, "updateddate": updatdate }, "id"));
    //     query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "goldsmith_id": data.goldsmith_id, "status": "give_goldsmith", updateddate: updatdate }, "id"));
    //   })
    // }
    delete (data.item_array);

    RestApi.getDb("give_goldsmith").insert(data, "id")
      .then((result) => {
        if (query.length > 0)
          return Promise.all(query);
        else
          return undefined;
      })
      .then((result) => {
        if (data.isfinished == 1) {
          return RestApi.getKnex().batchInsert("item", real_item_arr);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_goldsmith_items", item_arr);
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
    const postUrl = `/give-goldsmith/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/give-goldsmith" };
    params = Permission.getMenuParams(params, req, res);

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("give_goldsmith")
      .where({ "give_goldsmith.id": data.id })
      .select()
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("give_goldsmith_items").leftJoin("category", "give_goldsmith_items.category_id", "category.id").leftJoin("goldsmith_code", "give_goldsmith_items.goldsmith_code_id", "goldsmith_code.id").where("give_goldsmith_id", data.id).select("give_goldsmith_items.*", "category.category_name as category", "goldsmith_code.code as goldsmith_code");
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            if (item.goldrate == "a") {
              item.goldrate = "၁၆ ပဲရည်";
            } else if (item.goldrate == "b") {
              item.goldrate = "၁၅ ပဲရည်";
            } else if (item.goldrate == "c") {
              item.goldrate = "၁၄ ပဲရည်";
            } else if (item.goldrate == "d") {
              item.goldrate = "၁၃ ပဲရည်";
            }
          });
        }
        params.item_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-goldsmith-entry", params);
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
    const item_array = JSON.parse(data.item_array);
    data.updateddate = Utils.toSqlDate(new Date());
    const updatdate = Utils.toSqlDate(new Date());
    const item_arr: any = [];
    const real_item_arr: any = [];
    const query: any = [];
    let gold_rate = "";

    item_array.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
        delete item.goldsmith_code;
      } else {
        item.id = uuid.v4();
        item.give_goldsmith_id = data.id;
      }
      item.give_goldsmith_id = data.id;
      if (item.goldrate == "၁၆ ပဲရည်") {
        item.goldrate = "a";
        gold_rate = "py_16";
      } else if (item.goldrate == "၁၅ ပဲရည်") {
        item.goldrate = "b";
        gold_rate = "py_15";
      } else if (item.goldrate == "၁၄ ပဲရည်") {
        item.goldrate = "c";
        gold_rate = "py_14";
      } else if (item.goldrate == "၁၃ ပဲရည်") {
        item.goldrate = "d";
        gold_rate = "py_13";
      }
      item = comfunc.fillDefaultFields(item);
      query.push(RestApi.getDb("stock").decrement(gold_rate, item.pay_wgt_gm));
      if (data.isfinished == 1) {
        item.is_stock = 1;
        let real_item: any = {
          id: uuid.v4(),
          date: Utils.toSqlDate(new Date()),
          goldsmith_id: data.goldsmith_id,
          item_name: item.item_name,
          category_id: item.category_id,
          goldrate: item.goldrate,
          is_stock: 0,
          status: "gold"
        };
        real_item = comfunc.fillDefaultFields(real_item);
        item.item_id = real_item.id;
        real_item_arr.push(real_item);
        query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "goldsmith_id": data.goldsmith_id, "status": "give_goldsmith", "item_id": real_item.id, "use_status": "no-use", updateddate: updatdate }, "id"));
        query.push(RestApi.getKnex().batchInsert("item", real_item_arr));
        // query.push(RestApi.getDb("give_goldsmith_items").where("goldsmith_code_id", item.goldsmith_code_id).delete());
      } else {
        item.is_stock = 0;
        query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "use_status": "used", updateddate: updatdate }, "id"));
      }
      item_arr.push(item);
    });
    // if (data.isfinished == 1) {
    //   item_arr.forEach((item: any) => {
    //     // query.push(RestApi.getDb("order_mould_items").where("id", item.order_mould_item_id).update({ "is_stock": 0, "updateddate": updatdate }, "id"));
    //     query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "goldsmith_id": data.goldsmith_id, "status": "give_goldsmith", updateddate: updatdate }, "id"));
    //   });
    // }

    delete data.item_array;

    let db = RestApi.getDb("give_goldsmith");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });

    RestApi.getDb("give_goldsmith_items")
      .where("give_goldsmith_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            let goldrate = "";
            if (item.goldrate == "a")
              goldrate = "py_16";
            else if (item.goldrate == "b")
              goldrate = "py_15";
            else if (item.goldrate == "c")
              goldrate = "py_14";
            else if (item.goldrate == "d")
              goldrate = "py_13";
            query.push(RestApi.getDb("stock").increment(goldrate, item.pay_wgt_gm));
            let isExit = 0;
            if (item_arr.length > 0) {
              item_arr.forEach((new_item: any) => {
                if (item.goldsmith_code_id == new_item.goldsmith_code_id)
                  isExit = 1;
              });
            }
            if (!isExit) {
              query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "use_status": "no-use", "updateddate": updatdate }, "id"));
            }
          });
        }
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("give_goldsmith_items").where("give_goldsmith_id", data.id).delete();
      })
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_goldsmith_items", item_arr);
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
    RestApi.getDb("give_goldsmith_items")
      .where("give_goldsmith_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            let goldrate = "";
            if (item.goldrate == "a")
              goldrate = "py_16";
            else if (item.goldrate == "b")
              goldrate = "py_15";
            else if (item.goldrate == "c")
              goldrate = "py_14";
            else if (item.goldrate == "d")
              goldrate = "py_13";
            query.push(RestApi.getDb("stock").increment(goldrate, item.pay_wgt_gm));
            query.push(RestApi.getDb("goldsmith_code").where("id", item.goldsmith_code_id).update({ "use_status": "no-use", "updateddate": Utils.toSqlDate(new Date()) }, "id"));
          });
        }
        if (query.length > 0)
          return Promise.all(query);
        else
          return undefined;
      })
      .then((result) => {
        return RestApi.getDb("give_goldsmith_items").where("give_goldsmith_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("give_goldsmith").where({ id: data.id }).delete("id");
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
    const postUrl = `/give-goldsmith/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("give_goldsmith")
      .leftJoin("goldsmith", "give_goldsmith.goldsmith_id", "goldsmith.id")
      .where("give_goldsmith.id", data.id)
      .select("give_goldsmith.*", "goldsmith.goldsmith_name")
      .then((result) => {
        console.log("data ", result[0]);
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("give_goldsmith_items").leftJoin("goldsmith_code", "goldsmith_code_id", "goldsmith_code.id").leftJoin("category", "give_goldsmith_items.category_id", "category.id").where({ "give_goldsmith_id": data.id }).select("give_goldsmith_items.*", "goldsmith_code.code", "category.category_name")
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            if (item.goldrate == "a")
              item.goldrate = "၁၆ ပဲရည်";
            else if (item.goldrate == "b")
              item.goldrate = "၁၅ ပဲရည်";
            else if (item.goldrate == "c")
              item.goldrate = "၁၄ ပဲရည်";
            else if (item.goldrate == "d")
              item.goldrate = "၁၃ ပဲရည်";
          })
        }
        params.item_array = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-goldsmith-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new GiveGoldsmithRouter();