/**
 * Give Outside Routes
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

class GiveOutsideRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/give-outside").all(Permission.onLoad).get(this.getList);
    this.route("/give-outside/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/give-outside/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/give-outside/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/give-outside/preview/:id").all(Permission.onLoad).get(this.getDetail);
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
          res.render("dashboard/give-outside", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/give-outside", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/give-outside/entry", params: {}, listUrl: "/give-outside" };
    params = Permission.getMenuParams(params, req, res);

    const count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "order_mould")
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((mould) => {
            let count = 0;
            if (mould.lastdate == datecode) {
              count = mould.currentvalue;
            } else {
              mould.lastdate = datecode;
            }
            mould.count = count;
          });
        }
        params.params.codes = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.item_array = [];
        params.datecode = datecode;

      //   return RestApi.getDb("autogenerate").where("prefix", "GO").select();
      // })
      // .then((result) => {
      //   if (result[0].lastdate == datecode) {
      //       count = result[0].currentvalue + 1;
      //   } else {
      //       count++;
      //       result[0].lastdate = datecode;
      //   }
      //   params.params.code = "GO" + datecode + count;

        if (typeof (<any>req).jwtToken == "function") {
            return (<any>req).jwtToken(jwtCredentialId);
        } else {
            return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-outside-entry", params);
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
    const codes = JSON.parse(data.codes);
    const item_array = JSON.parse(data.item_array);
    // const prefix = "GO";
    const count = 0;
    let total_wgt_gm = 0;
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const query: any = [];

    let gold_rate = "";
    if (data.goldrate == "a") {
      // data.goldrate = "a";
      gold_rate = "py_16";
    } else if (data.goldrate == "b") {
      // data.goldrate = "b";
      gold_rate = "py_15";
    } else if (data.goldrate == "c") {
      // data.goldrate = "c";
      gold_rate = "py_14";
    } else if (data.goldrate == "d") {
      // data.goldrate = "d";
      gold_rate = "py_13";
    }
    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.give_outside_id = data.id;
      item.status = "no-use";
      if (item.type == "diamond") {
        if (item.diamond_wgt_ct > 0)
          item.diamond_wgt_gm = item.diamond_wgt_ct / 5;
      } else {
        item.diamond_wgt_ct = 0;
        item.diamond_wgt_gm = 0;
        item.qty = 0;
      }
      item = comfunc.fillDefaultFields(item);

      if (data.isfinished == 1) {
        item.is_stock = 1;
      }
      else
        item.is_stock = 0;
      total_wgt_gm += Number(item.gold_wgt_gm);
      item_arr.push(item);
      if (item.qty > 0)
        query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).decrement("current_qty", item.qty));
    });
    query.push(RestApi.getDb("stock").decrement(gold_rate, total_wgt_gm));

    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    delete (data.codes);
    delete (data.item_array);

    // RestApi.getDb("autogenerate")
    //   .where("prefix", prefix)
    //   .select()
    //   .then((result) => {
    //     if (result[0].lastdate == datecode) {
    //       count = result[0].currentvalue + 1;
    //     } else {
    //       count++;
    //       result[0].lastdate = datecode;
    //     }
    //     data.code = prefix + datecode + count;
    //     return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
    //   })
      // .then((result) => {
      //     return RestApi.getDb("give_outside").insert(data, "id");
      // })
    RestApi.getDb("give_outside")
      .insert(data, "id")
      .then((result) => {
        if (query.length > 1) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_outside_items", item_arr);
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
    const postUrl = `/give-outside/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/give-outside" };
    params = Permission.getMenuParams(params, req, res);
    let codes: any = [];

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("tablename", "order_mould")
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((mould) => {
            let count = 0;
            if (mould.lastdate == datecode) {
              count = mould.currentvalue;
            } else {
              mould.lastdate = datecode;
            }
            mould.count = count;
          });
        }
        codes = result;
        params.datecode = datecode;

        return RestApi.getDb("give_outside").where({ "give_outside.id": data.id }).select();
      })
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        params.params.codes = codes;
        return RestApi.getDb("give_outside_items").leftJoin("category", "category_id", "category.id").leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_outside_items.diamond_id", "diamond_items.id").where("give_outside_id", data.id).select("give_outside_items.*", "category.category_name as category", "whole_diamond.code as wholediamond", "diamond_items.code as diamond");
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
            });
        }
        params.item_array = result;
        return RestApi.getDb("stock").select().first();
      })
      .then((result) => {
        const goldrate = params.params.goldrate;
        let current_gold_gm = 0;
        if (goldrate == "a")
          current_gold_gm = result['py_16'];
        else if (goldrate == "b")
          current_gold_gm = result['py_15'];
        else if (goldrate == "c")
          current_gold_gm = result['py_14'];
        else if (goldrate == "d")
          current_gold_gm = result['py_13'];
        params.current_gold_gm = current_gold_gm;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/give-outside-entry", params);
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
    const items = JSON.parse(data.item_array);
    const codes = JSON.parse(data.codes);
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const query: any = [];
    let gold_rate = "";
    let total_wgt_gm = 0;

    if (data.goldrate == "a") {
      // data.goldrate = "a";
      gold_rate = "py_16";
    } else if (data.goldrate == "b") {
      // data.goldrate = "b";
      gold_rate = "py_15";
    } else if (data.goldrate == "c") {
      // data.goldrate = "c";
      gold_rate = "py_14";
    } else if (data.goldrate == "d") {
      // data.goldrate = "d";
      gold_rate = "py_13";
    }
    items.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
        delete item.wholediamond;
        delete item.diamond;
      } else {
        item.id = uuid.v4();
        item.give_outside_id = data.id;
        item.status = "no-use";
      }
      if (data.isfinished == 1) {
        item.is_stock = 1;
      }
      else
        item.is_stock = 0;
      total_wgt_gm += Number(item.gold_wgt_gm);
      if (item.type == "diamond") {
        if (item.diamond_wgt_ct > 0)
          item.diamond_wgt_gm = item.diamond_wgt_ct / 5;
      } else {
        item.diamond_wgt_ct = 0;
        item.diamond_wgt_gm = 0;
        item.qty = 0;
      }
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
      if (item.qty > 0) {
        query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).decrement("current_qty", item.qty));
      }
    });
    query.push(RestApi.getDb("stock").decrement(gold_rate, total_wgt_gm));
    total_wgt_gm = 0;
    delete data.codes;
    delete data.item_array;

    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    let db = RestApi.getDb("give_outside");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });

    db.update(data, "id")
      .then((result) => {
        return RestApi.getDb("give_outside_items").where("give_outside_id", data.id).select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            total_wgt_gm += Number(item.gold_wgt_gm);
            if (item.qty > 0)
              query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).increment("current_qty", item.qty));
          });
          query.push(RestApi.getDb("stock").increment(gold_rate, total_wgt_gm));
        }
        return RestApi.getDb("give_outside_items").where("give_outside_id", data.id).delete();
      })
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("give_outside_items", item_arr);
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
    RestApi.getDb("give_outside_items")
      .where("give_outside_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
            result.forEach((item) => {
                let gold_rate = "";
                if (item.goldrate == "a") {
                    gold_rate = "py_16";
                } else if (item.goldrate == "b") {
                    gold_rate = "py_15";
                } else if (item.goldrate == "c") {
                    gold_rate = "py_14";
                } else if (item.goldrate == "d") {
                    gold_rate = "py_13";
                }
                query.push(RestApi.getDb("stock").increment(gold_rate, item.gold_wgt_gm));
                if (item.qty > 0) {
                    query.push(RestApi.getDb("diamond_items").where("id", item.diamond_id).increment("current_qty", item.qty));
                }
            });
        }
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("give_outside_items").where("give_outside_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("give_outside").where({ id: data.id }).delete("id");
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
    const postUrl = `/give-outside/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("give_outside")
      .leftJoin("goldsmith", "give_outside.goldsmith_id", "goldsmith.id")
      .where("give_outside.id", data.id)
      .select("give_outside.*", "goldsmith.goldsmith_name")
      .then((result) => {
        console.log("data ", result[0]);
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        if (result[0].goldrate == "a")
          result[0].goldrate = "၁၆ ပဲရည်";
        else if (result[0].goldrate == "b")
          result[0].goldrate = "၁၅ ပဲရည်";
        else if (result[0].goldrate == "c")
          result[0].goldrate = "၁၄ ပဲရည်";
        else if (result[0].goldrate == "d")
          result[0].goldrate = "၁၃ ပဲရည်";
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("give_outside_items").leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id").leftJoin("diamond_items", "give_outside_items.diamond_id", "diamond_items.id").leftJoin("category", "give_outside_items.category_id", "category.id").where({ "give_outside_id": data.id }).select("give_outside_items.*", "diamond_items.code as item_code", "whole_diamond.code as wholediamond_code", "category.category_name")
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
        res.render("dashboard/give-outside-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new GiveOutsideRouter();