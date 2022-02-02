/**
 * Dashboard View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";
import moment from "moment";

export class DashboardView {
  constructor() { }

  public index(args: any, cb: Function) {
    const data: any = {
      data: []
    };

    RestApi.getDb("purchase")
      .select()
      .then((result) => {
        cb(undefined, result);
      })
      .catch((err) => {
        cb(undefined, err);
      });

  }

  public barchart(args: any, cb: Function) {
    const fromnoformat = moment(new Date()).subtract(6, "days").toDate();
    const fromdate = moment(fromnoformat).format("YYYY-MM-DD");
    const todate = moment(new Date()).format("YYYY-MM-DD");
    const date: any = [];
    const amount: any = [];
    RestApi.getKnex()
      .raw(`SELECT SUM(net_amount) AS amount, saledate FROM sale
            WHERE saledate BETWEEN '` + fromdate + `' AND '` + todate + `'
            GROUP BY saledate`)
      .then((result) => {
        const data = result[0];
        data.forEach((gold: any) => {
          date.push(Utils.toDisplayDate(gold.saledate));
          amount.push(Utils.toDisplayAmount(gold.amount));
        });
        cb(undefined, {
          date: date,
          amount: amount
        });
      })
      .catch((err: any) => {
        cb(undefined, err);
      });
  }

  public listchart(args: any, cb: Function) {
    const startDate = Utils.toSqlDate(args.start);
    const endDate = Utils.toSqlDate(args.end);
    RestApi.getKnex()
      .raw(`SELECT customer.customer_name AS name, count(sale.id) AS quantity, sale.stock_code, SUM(sale.net_amount) AS net_amount FROM sale
            LEFT JOIN customer ON sale.customer_id = customer.id
            WHERE saledate BETWEEN '` + startDate + `' AND '` + endDate + `'
            GROUP BY sale.customer_id
            ORDER BY quantity desc
            LIMIT 5`)
      .then((result) => {
        cb(undefined, {
          data: result[0]
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public piechart(args: any, cb: Function) {
    const items: any = [];
    const quantity: any = [];
    RestApi.getDb("sale")
      .select("saledate")
      .orderBy("saledate", "desc")
      .first()
      .then((result_date) => {
        const date = Utils.toSqlDate(result_date.saledate);
        return RestApi.getKnex()
          .raw(`SELECT item.item_name AS name, count(sale.id) AS quantity FROM sale
            LEFT JOIN purchase ON sale.stock_code = purchase.stock_code
            LEFT JOIN item ON purchase.itemid = item.id
            WHERE saledate = '` + date + `'
            GROUP BY purchase.itemid, name
            ORDER BY quantity
            LIMIT 4`);
      })
      .then((result) => {
        result[0].forEach((item: any) => {
          items.push(item.name);
          quantity.push(item.quantity);
        });
        cb(undefined, {
          items: items,
          quantity: quantity
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public listgoldorder(args: any, cb: Function) {
    RestApi.getDb("goldsmithorder")
      .select("supplier.supplier_name", "subcategory.subcategory_name", "goldsmithorder.paydate", "goldsmithorder.stock_code")
      .leftJoin("supplier", "goldsmithorder.supplier_id", "supplier.id")
      .leftJoin("purchase", "goldsmithorder.stock_code", "purchase.stock_code")
      .leftJoin("subcategory", "purchase.subcategoryid", "subcategory.id")
      .orderBy("paydate", "asc")
      .limit(5)
      .then((result) => {
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public getTopCustomersReport(args: any, cb: Function) {
    const startDate = Utils.toSqlDate(args.start);
    const endDate = Utils.toSqlDate(args.end);
    RestApi.getKnex()
      .raw(`SELECT customer.customer_name AS name, count(sale.id) AS quantity, sale.stock_code, SUM(sale.net_amount) AS net_amount FROM sale
            LEFT JOIN customer ON sale.customer_id = customer.id
            WHERE saledate BETWEEN '` + startDate + `' AND '` + endDate + `'
            GROUP BY sale.customer_id
            ORDER BY quantity desc
            LIMIT 5`)
      .then((result) => {
        cb(undefined, {
          data: result[0]
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public getDailySalesReport(args: any, cb: Function) {
    RestApi.getDb("sale")
      .select("saledate")
      .orderBy("saledate", "desc")
      .first()
      .then((result_date) => {
        const date = Utils.toSqlDate(result_date.saledate);
        return RestApi.getKnex()
          .raw(`SELECT item.item_name AS name, sale.stock_code, count(sale.id) AS quantity FROM sale
            LEFT JOIN purchase ON sale.stock_code = purchase.stock_code
            LEFT JOIN item ON purchase.itemid = item.id
            WHERE saledate = '` + date + `'
            GROUP BY purchase.itemid, name`);
      })
      .then((result) => {
        cb(undefined, {
          data: result[0]
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public getGoldSmithOrderReport(args: any, cb: Function) {
    RestApi.getDb("goldsmithorder")
      .select("supplier.supplier_name", "subcategory.subcategory_name", "goldsmithorder.paydate", "goldsmithorder.stock_code")
      .leftJoin("supplier", "goldsmithorder.supplier_id", "supplier.id")
      .leftJoin("purchase", "goldsmithorder.stock_code", "purchase.stock_code")
      .leftJoin("subcategory", "purchase.subcategoryid", "subcategory.id")
      .orderBy("paydate", "asc")
      .then((result) => {
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }

  public getData(args: any, cb: Function) {
    const data: any = {
      data: []
    };
    // const startDate = Utils.toSqlDate(args.date);
    // console.log("startDate ", startDate);
    RestApi.getKnex()
      .raw("\
        SELECT COUNT(*) as count\
        FROM `goldsmith_code` \
        WHERE `status` = 'get_goldsmith' AND `use_status` = 'no-use'\
        ")
      .then((result) => {
        data.get_goldsmith = result[0];
        return RestApi.getKnex()
                  .raw("\
                SELECT COUNT(*) as count\
                FROM `customer` \
                ");
      })
      .then((result) => {
        data.customer = result[0];
        return RestApi.getKnex()
                  .raw(`SELECT COUNT(*) as count FROM item
                  WHERE is_stock = 1 AND is_sale = 0`);
      })
      .then((result) => {
        data.item = result[0];
        console.log("data ", data);
        cb(undefined, data);
      })
      .catch((err) => {
        cb(err, data);
      });
  }

  public getSaleDiamond(args: any, cb: Function) {
    const startDate = moment(new Date()).subtract(7, "days").toDate();
    const start = Utils.toSqlDate(startDate);
    const endDate = moment(new Date()).format("DD/MM/YYYY");
    const end = Utils.toSqlDate(endDate);
    console.log("startdate ", startDate);
    console.log("endDate ", endDate);
    console.log("start ", start);
    console.log("end ", end);
    const sale_person = args.sale_person;
    RestApi.getDb("sale_diamond_items")
      .leftJoin("item", "sale_diamond_items.item_id", "item.id")
      .leftJoin("sale_diamond", "sale_diamond_items.sale_diamond_id", "sale_diamond.id")
      .leftJoin("customer", "sale_diamond.customer_id", "customer.id")
      .leftJoin("sale_person", "sale_diamond.sale_person_id", "sale_person.id")
      .where("sale_diamond.date", ">=", start)
      .andWhere("sale_diamond.date", "<=", end)
      .select("sale_diamond.date", "sale_diamond.voc_no", "customer.code as customer_code", "customer.customer_name", "sale_person.sale_person_name", "item.code as item_code", "item.item_name", "sale_diamond_items.wgt_gm", "sale_diamond_items.image", "sale_diamond_items.price")
      .orderBy("sale_diamond.date", "desc")
      .then((result) => {
        console.log("data ", result);
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, err);
      });
  }
}

export default new DashboardView();