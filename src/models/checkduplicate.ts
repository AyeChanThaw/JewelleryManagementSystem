/**
 * Check Duplicate Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";
import * as uuid from "uuid";

export class CheckDuplicate {
  constructor() { }

  public index(args: any, cb: Function) {

  }

  public checkDiamondType(args: any, cb: Function) {
    RestApi.getDb("diamondtype")
      .where("diamondtype", args.diamondtype)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkGemType(args: any, cb: Function) {
    RestApi.getDb("gemtype")
      .where("gemtype", args.gemtype)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkGemPrefix(args: any, cb: Function) {
    RestApi.getDb("gemtype")
      .where("prefix", args.prefix)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkCategoryPrefix(args: any, cb: Function) {
    RestApi.getDb("item")
      .where("item_code", args.prefix)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkCarat(args: any, cb: Function) {
    RestApi.getDb("carat")
      .where("carat", args.carat)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkLonesee(args: any, cb: Function) {
    RestApi.getDb("lonesee")
      .where("lonesee", args.lonesee)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkGoldRawType(args: any, cb: Function) {
    RestApi.getDb("goldraw_type")
      .where("goldraw_type", args.goldraw_type)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkBank(args: any, cb: Function) {
    RestApi.getDb("bank")
      .where("bank_name", args.bank)
      .andWhere("account", args.account)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkBranchCode(args: any, cb: Function) {
    RestApi.getDb("branch")
      .where("branch_code", args.code)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkSupplier(args: any, cb: Function) {
    RestApi.getDb("supplier")
      .where({ "supplier_name": args.supplier_name, "sale_person": args.sale_person})
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }

  public checkGrade(args: any, cb: Function) {
    RestApi.getDb("grade")
      .where("grade_name", args.grade)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        if (result.length > 0)
          cb(undefined, true);
        else
          cb(undefined, false);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Check Error"
          }
        });
      });
  }
}

export default new CheckDuplicate();