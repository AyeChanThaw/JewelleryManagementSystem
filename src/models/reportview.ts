/**
 * Report View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";
import moment from "moment";
import uuid from "uuid";

export class ReportView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("item")
            .select("item.*", "category.category_name")
            .leftJoin("category", "item.category_id", "category.id")
            .then((result) => {
                cb(undefined, {
                    item: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getPurchasePTReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getDb("purchase_pt_items")
            .leftJoin("category", "category_id", "category.id")
            .where("purchase_pt_items.createddate", ">=", startDate)
            .andWhere("purchase_pt_items.createddate", "<=", endDate)
            .andWhere("current_qty", ">", 0)
            .orderBy("purchase_pt_items.createddate", "desc")
            .select("purchase_pt_items.code", "purchase_pt_items.current_qty", "category.category_name")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getWholeDiamondReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getDb("whole_diamond")
            .leftJoin("supplier", "supplier_id", "supplier.id")
            .where("whole_diamond.date", ">=", startDate)
            .andWhere("whole_diamond.date", "<=", endDate)
            .andWhere("current_carat", ">", 0)
            .orderBy("whole_diamond.date", "desc")
            .select("whole_diamond.code", "whole_diamond.voc_no", "whole_diamond.current_carat", "supplier.supplier_name")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getGetGoldsmithReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT goldsmith_code.code, goldsmith.goldsmith_name, get_goldsmith.date FROM goldsmith_code
            LEFT JOIN get_goldsmith ON goldsmith_code.id = get_goldsmith.goldsmith_code_id
            LEFT JOIN goldsmith ON get_goldsmith.goldsmith_id = goldsmith.id
            WHERE goldsmith_code.status = 'get_goldsmith' and goldsmith_code.use_status = 'no-use' AND get_goldsmith.date >= '` + startDate + `' AND get_goldsmith.date <= '` + endDate + `'`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getItemReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let checkDate = moment().subtract(90, "days").calendar();
        checkDate = moment(checkDate).format("YYYY-MM-DD");
        RestApi.getKnex().raw(`SELECT *,
            case
                when item.date < '` + checkDate + `' then 'expired'
                else 'no-expire'
            END AS status
            FROM item
            WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
            AND is_stock = 1 AND is_sale = 0`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDailyCashReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getDb("daily_cash")
            .where("daily_cash.date", ">=", startDate)
            .andWhere("daily_cash.date", "<=", endDate)
            .andWhere("cash_out", ">", 0)
            .orderBy("daily_cash.date", "desc")
            .select("daily_cash.date", "daily_cash.cash_out as price", "daily_cash.type")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDailyCashShowroomReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getDb("daily_cash_showroom")
            .where("daily_cash_showroom.date", ">=", startDate)
            .andWhere("daily_cash_showroom.date", "<=", endDate)
            .andWhere("cash_out", ">", 0)
            .orderBy("daily_cash_showroom.date", "desc")
            .select("daily_cash_showroom.date", "daily_cash_showroom.cash_out as price", "daily_cash_showroom.type")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getSaleDiamondReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const sale_person = args.sale_person;
        let dbQuery = RestApi.getDb("sale_diamond_items")
                        .leftJoin("item", "sale_diamond_items.item_id", "item.id")
                        .leftJoin("sale_diamond", "sale_diamond_items.sale_diamond_id", "sale_diamond.id")
                        .leftJoin("customer", "sale_diamond.customer_id", "customer.id")
                        .leftJoin("sale_person", "sale_diamond.sale_person_id", "sale_person.id")
                        .where("sale_diamond.date", ">=", startDate)
                        .andWhere("sale_diamond.date", "<=", endDate)
                        .select("sale_diamond.date", "sale_diamond.voc_no", "customer.code as customer_code", "customer.customer_name", "sale_person.sale_person_name", "item.code as item_code", "item.item_name", "sale_diamond_items.wgt_gm", "sale_diamond_items.image", "sale_diamond_items.price");

        if (sale_person && sale_person != "") {
            dbQuery = dbQuery.where("sale_person_id", sale_person);
        }
        dbQuery.orderBy("sale_diamond.date", "desc")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getSaleGoldReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const sale_person = args.sale_person;
        let dbQuery = RestApi.getDb("sale_gold_items")
                        .leftJoin("item", "sale_gold_items.item_id", "item.id")
                        .leftJoin("sale_gold", "sale_gold_items.sale_gold_id", "sale_gold.id")
                        .leftJoin("customer", "sale_gold.customer_id", "customer.id")
                        .leftJoin("sale_person", "sale_gold.sale_person_id", "sale_person.id")
                        .where("sale_gold.date", ">=", startDate)
                        .andWhere("sale_gold.date", "<=", endDate)
                        .select("sale_gold.date", "sale_gold.voc_no", "customer.code as customer_code", "customer.customer_name", "sale_person.sale_person_name", "item.code as item_code", "item.item_name", "sale_gold_items.wgt_k", "sale_gold_items.wgt_p", "sale_gold_items.wgt_y", "sale_gold_items.image", "sale_gold_items.price");

        if (sale_person && sale_person != "") {
            dbQuery = dbQuery.where("sale_person_id", sale_person);
        }
        dbQuery.orderBy("sale_gold.date", "desc")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getSupplierDebtReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getDb("diamond_debt")
            .leftJoin("supplier", "diamond_debt.supplier_id", "supplier.id")
            .leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id")
            .where("diamond_debt.date", ">=", startDate)
            .andWhere("diamond_debt.date", "<=", endDate)
            .orderBy("diamond_debt.date", "desc")
            .select("diamond_debt.date", "supplier.supplier_name", "whole_diamond.voc_no", "diamond_debt.balance")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getCustomerDebtReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT customer_debt.date, customer.customer_name, customer_debt.balance, customer_debt.sale_diamond_id, customer_debt.sale_gold_id, IF(sale_diamond_id = '', sale_gold.voc_no, sale_diamond.voc_no) AS voc_no FROM customer_debt
            LEFT JOIN customer ON customer_debt.customer_id = customer.id
            LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
            LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
            WHERE customer_debt.date BETWEEN '` + startDate + `' AND '` + endDate + `'
            ORDER BY customer_debt.date DESC`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDiamondReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const diamond_item_id: any = [];
        let diamond_arr: any = [];
        RestApi.getKnex().raw(`SELECT diamond_items.id as diamond_item_id, whole_diamond.code AS wholediamond_code, supplier.supplier_name, diamond_items.code AS diamond_code, diamond_items.qty, diamond_items.current_qty FROM diamond_items
            LEFT JOIN whole_diamond ON diamond_items.wholediamond_id = whole_diamond.id
            LEFT JOIN supplier ON supplier_id = supplier.id
            WHERE whole_diamond.date BETWEEN '` + startDate + `' AND '` + endDate + `'
            ORDER BY whole_diamond.date`)
            .then((result) => {
                diamond_arr = result[0];
                diamond_arr.forEach((diamond: any) => {
                    diamond_item_id.push(diamond.diamond_item_id);
                });
                console.log("diamond arr ", diamond_arr);
                return RestApi.getDb("item_diamonds")
                    .leftJoin("item", "item_id", "item.id")
                    .leftJoin("goldsmith", "goldsmith_id", "goldsmith.id")
                    .select("item_diamonds.diamond_item_id", "item.code as item_code", "item.item_name", "goldsmith.goldsmith_name", "item_diamonds.qty as diamond_qty")
                    .whereIn("item_diamonds.diamond_item_id", diamond_item_id) as PromiseLike<any>;
            })
            .then((result) => {
                diamond_arr.map((diamond: any) => {
                    const detail = result.filter((item: any) => {
                        return item.diamond_item_id == diamond.diamond_item_id;
                    });
                    diamond.items = detail;
                });
                console.log("diamond_arr final ", diamond_arr);
                cb(undefined, {
                    data: diamond_arr
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getGoldsmithReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT give_goldsmith.date, goldsmith.goldsmith_name, item.item_name, IFNULL(item.code, goldsmith_code.code) AS item_code, give_goldsmith_items.wgt_gm, give_goldsmith_items.pay_wgt_gm , get_goldsmith.wgt_gm AS return_wgt_gm, get_goldsmith.gm_amt, get_goldsmith.get_wgt_gm, get_goldsmith.remain_wgt_gm 
            FROM give_goldsmith_items
            LEFT JOIN goldsmith_code ON give_goldsmith_items.goldsmith_code_id = goldsmith_code.id
            LEFT JOIN give_goldsmith ON give_goldsmith_id = give_goldsmith.id
            LEFT JOIN goldsmith ON give_goldsmith.goldsmith_id = goldsmith.id
            LEFT JOIN item ON give_goldsmith_items.item_id = item.id
            LEFT JOIN get_goldsmith ON item.id = get_goldsmith.item_id
            WHERE give_goldsmith.date BETWEEN '` + startDate + `' AND '` + endDate + `'
            ORDER BY give_goldsmith.date`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getFirstPolishReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT first_polish.date, item.item_name, first_polish.wgt_gm, first_polish.goldrate, item.status FROM first_polish
            LEFT JOIN goldsmith_code ON goldsmith_code_id = goldsmith_code.id
            LEFT JOIN item ON goldsmith_code.item_id = item.id  
            WHERE first_polish.date BETWEEN '` + startDate + `' AND '` + endDate + `'
            ORDER BY first_polish.date`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public setDailyStock(args?: any, cb?: Function) {
        const date = Utils.toSqlDate(new Date());
        RestApi.getDb("stock")
            .select()
            .then((result) => {
                const stock: any = {
                    id: uuid.v4(),
                    date: date,
                    gold_gm: result[0].gold_total_gm,
                    brass_gm: result[0].brass_total_gm,
                    silver_gm: result[0].silver_total_gm,
                    mo_gm: result[0].mo_total_gm,
                    py13_gm: result[0].py_13,
                    py14_gm: result[0].py_14,
                    py15_gm: result[0].py_15,
                    py16_gm: result[0].py_16,
                    createddate: date,
                    updateddate: date
                }
                return RestApi.getDb("daily_stock").insert(stock, "id");
            })
            .then((result) => {
                cb(undefined, result);
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDailyStockReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT * FROM daily_stock
            WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
            ORDER BY date`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getReturnItem(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT return_items.*, category.category_name FROM return_items
            LEFT JOIN category ON category_id = category.id
            WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND is_delete = 0
            ORDER BY date`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getChangeDiamond(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT change_diamond_items.*, category.category_name, change_diamond.date, item.code FROM change_diamond_items
            LEFT JOIN change_diamond ON change_diamond_id = change_diamond.id
            LEFT JOIN category ON category_id = category.id
            LEFT JOIN item ON item_id = item.id
            WHERE change_diamond.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND change_diamond_items.is_delete = 0
            ORDER BY change_diamond.date`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getSalePerson(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let data:any = [];
        let saleperson_arr: any = [];
        RestApi.getKnex().raw(`SELECT sale_person_id, sale_person_name, COUNT(sale.id) AS total_qty, SUM(total_amount) AS amount
                FROM (
                    SELECT sale_diamond_items.id, date, sale_person_id, total_amount FROM sale_diamond_items
                    LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                    UNION ALL
                    SELECT sale_gold_items.id, date, sale_person_id, total_amount FROM sale_gold_items
                    LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                ) sale
                LEFT JOIN sale_person ON sale_person_id = sale_person.id
                WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
                GROUP BY sale_person_id`)
            .then((result) => {
                data = result[0];
                console.log("data ", data);
                if (data.length > 0) {
                    data.forEach((saleperson: any) => {
                        saleperson_arr.push(saleperson.sale_person_id);
                    });
                    console.log("sale person arr ", saleperson_arr);
                }
                return RestApi.getKnex().raw(`SELECT sale_diamond.date, voc_no, sale_person_id, customer_name, item.code as item_code, sale_diamond_items.wgt_gm, 0 AS wgt_k, 0 AS wgt_p, 0 AS wgt_y, sale_diamond_items.diamond_qty, total_amount 
                            FROM sale_diamond_items
                            LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                            LEFT JOIN item ON item_id = item.id
                            LEFT JOIN customer ON customer_id = customer.id
                            WHERE sale_diamond.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                            UNION ALL
                            SELECT sale_gold.date, voc_no, sale_person_id, customer_name, item.code as item_code, sale_gold_items.wgt_gm, sale_gold_items.wgt_k, sale_gold_items.wgt_p, sale_gold_items.wgt_y, 0 AS diamond_qty, total_amount 
                            FROM sale_gold_items
                            LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                            LEFT JOIN item ON item_id = item.id
                            LEFT JOIN customer ON customer_id = customer.id
                            WHERE sale_gold.date BETWEEN '` + startDate + `' AND '` + endDate + `'`)
            })
            .then((result) => {
                const details = result[0];
                console.log("details ", details);
                data.map((saleperson: any) => {
                    const detail = details.filter((item: any) => {
                        return item.sale_person_id == saleperson.sale_person_id;
                    });
                    saleperson.items = detail;
                });
                console.log("data final ", data);
                cb(undefined, {
                    data: data
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getOrderMouldReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT order_mould.date, order_mould_items.code, order_mould_items.wgt_gm FROM order_mould_items
                LEFT JOIN order_mould ON order_mould_id = order_mould.id
                WHERE order_mould.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                AND order_mould.isfinished = 1
                ORDER BY order_mould.date DESC`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getSaleReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const type = args.type == "" ? "all" : args.type;
        const delivery_type = args.delivery_type == "" ? "all" : args.delivery_type;
        let db: any;
        if (type == "diamond") {
            if (delivery_type == "all") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
                        ORDER BY date ASC`);
            } else if (delivery_type == "pickup") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'pickup'
                        ORDER BY date ASC`);
            } else if (delivery_type == "delivery") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'delivery'
                        ORDER BY date ASC`);
            }
            
        } else if (type == "gold") {
            if (delivery_type == "all") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
                        ORDER BY date ASC`);
            } else if (delivery_type == "pickup") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'pickup'
                        ORDER BY date ASC`);
            } else if (delivery_type == "delivery") {
                db = RestApi.getKnex().raw(`SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'delivery'
                        ORDER BY date ASC`);
            }
        } else if (type == "all") {
            if (delivery_type == "all") {
                db = RestApi.getKnex().raw(`SELECT * from (
                        SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'
                        UNION ALL
                        SELECT DATE, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `') as sale
                        ORDER BY date ASC`);
            } else if (delivery_type == "pickup") {
                db = RestApi.getKnex().raw(`SELECT * from (
                        SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'pickup'
                        UNION ALL
                        SELECT DATE, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'pickup') as sale
                        ORDER BY date ASC`);
            } else if (delivery_type == "delivery") {
                db = RestApi.getKnex().raw(`SELECT * from (
                        SELECT date, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_diamond
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'delivery'
                        UNION ALL
                        SELECT DATE, voc_no, cash_amount, bank_amount, debt_amount, description FROM sale_gold
                        WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `' AND delivery_type = 'delivery') as sale
                        ORDER BY date ASC`);
            }
        }
        db.then((result: any) => {
                console.log("data ", result[0]);
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err: any) => {
                cb(undefined, err);
            });
    }

    public getSaleCustomerReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let data:any = [];
        let saleperson_arr: any = [];
        RestApi.getKnex().raw(`SELECT voc_no, sale_diamond.id, pay_amount AS total_amount, IFNULL(customer_debt.balance, 0) AS balance FROM sale_diamond
                    LEFT JOIN customer_debt ON sale_diamond.id = customer_debt.sale_diamond_id
                    WHERE sale_diamond.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND sale_diamond.customer_id = '` + args.customer + `'
                    UNION ALL
                    SELECT voc_no, sale_gold.id, pay_amount AS total_amount, IFNULL(customer_debt.balance, 0) AS balance FROM sale_gold
                    LEFT JOIN customer_debt ON sale_gold.id = customer_debt.sale_gold_id
                    WHERE sale_gold.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND sale_gold.customer_id = '` + args.customer + `'`)
            .then((result) => {
                data = result[0];
                // console.log("data ", data);
                return RestApi.getKnex().raw(`SELECT sale_diamond_id, sale_gold_id, (amount - balance) AS price FROM customer_debt
                            WHERE date BETWEEN '` + startDate + `' AND '` + endDate + `'`)
            })
            .then((result) => {
                const debts = result[0];
                data.map((sale: any) => {
                    const detail = debts.filter((item: any) => {
                        if (item.sale_diamond_id == sale.sale_diamond_items)
                            return item.price;
                        else if (item.sale_gold_id == sale.sale_gold_id)
                            return item.price;
                        else
                            return 0;
                    });
                    sale.total_amount = Number(sale.total_amount) - Number(detail);
                });
                return RestApi.getKnex().raw(`SELECT sale_diamond_id as id, item_name, code AS item_code FROM sale_diamond_items
                            LEFT JOIN item ON item_id = item.id
                            LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                            WHERE sale_diamond.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND sale_diamond.customer_id = '` + args.customer + `'
                            UNION ALL
                            SELECT sale_gold_id as id, item_name, code AS item_code FROM sale_gold_items
                            LEFT JOIN item ON item_id = item.id
                            LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                            WHERE sale_gold.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND sale_gold.customer_id = '` + args.customer + `'`)
            })
            .then((result) => {
                const items = result[0];
                console.log("items ", items);
                data.map((sale: any) => {
                    const detail = items.filter((item: any) => {
                        console.log("item id ", item.id);
                        console.log("sale id ", sale.id);
                        return item.id == sale.id;
                    });
                    console.log("detail ", detail);
                    sale.items = detail;
                    console.log("sale item ", sale.items);
                });
                cb(undefined, {
                    data: data
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getItemDetailReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT detail_date as date, item.image, code, item_name, category_name, wgt_gm, grade_name, diamond_qty, goldrate, price FROM item
            LEFT JOIN category ON category_id = category.id
            LEFT JOIN grade ON grade_id = grade.id
            WHERE detail_date BETWEEN '` + startDate + `' AND '` + endDate + `' AND is_detail = 1 AND is_stock = 0`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getOutsideGoldsmithReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        RestApi.getKnex().raw(`SELECT get_outside.date, goldsmith.goldsmith_name, item.code AS item_code, give_outside_items.gold_wgt_gm, diamond_items.code AS diamond_code, give_outside_items.qty AS diamond_qty, give_outside_items.diamond_wgt_gm, get_outside.gm_amt, get_outside.get_wgt_gm, get_outside.net_wgt_gm FROM get_outside
                LEFT JOIN give_outside_items ON give_outside_item_id = give_outside_items.id
                LEFT JOIN goldsmith ON get_outside.goldsmith_id = goldsmith.id
                LEFT JOIN item ON item_id = item.id
                LEFT JOIN diamond_items ON give_outside_items.diamond_id = diamond_items.id
                WHERE get_outside.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                ORDER BY DATE ASC`)
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getShowroomStockReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let query;
        console.log("type ", args.type);
        if (args.type == "" || args.type == "category") {
            query = RestApi.getKnex().raw(`SELECT COUNT(item.id) AS count, category_name AS name FROM item
                        LEFT JOIN category ON category_id = category.id
                        WHERE showroom_date BETWEEN '` + startDate + `' AND '` + endDate + `' AND (ISNULL(sale_date) OR sale_date > '` + endDate + `')
                        GROUP BY category_id`);
        } else if (args.type == "grade") {
            query = RestApi.getKnex().raw(`SELECT COUNT(item.id) AS count, grade_name AS name FROM item
                        LEFT JOIN grade ON grade_id = grade.id
                        WHERE showroom_date BETWEEN '` + startDate + `' AND '` + endDate + `' AND (ISNULL(sale_date) OR sale_date > '` + endDate + `')
                        GROUP BY grade_id`);
        } else if (args.type == "type") {
            query = RestApi.getKnex().raw(`SELECT COUNT(item.id) AS count, status AS name FROM item
                        WHERE showroom_date BETWEEN '` + startDate + `' AND '` + endDate + `' AND (ISNULL(sale_date) OR sale_date > '` + endDate + `')
                        GROUP BY status`);
        } else if (args.type == "gold_rate") {
            query = RestApi.getKnex().raw(`SELECT COUNT(item.id) AS count, goldrate AS name FROM item
                        WHERE showroom_date BETWEEN '` + startDate + `' AND '` + endDate + `' AND (ISNULL(sale_date) OR sale_date > '` + endDate + `')
                        GROUP BY goldrate`);
        }
        query.then((result) => {
                if (args.type == "gold_rate") {
                    const sales = result[0];
                    sales.forEach((sale: any) => {
                        if (sale.name == "a")
                            sale.name = "၁၆ ပဲရည်";
                        else if (sale.name == "b")
                            sale.name = "၁၅ ပဲရည်";
                        else if (sale.name == "c")
                            sale.name = "၁၄ ပဲရည်";
                        else if (sale.name == "d")
                            sale.name = "၁၃ ပဲရည်";
                    });
                    result[0] = sales;
                }
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDebtPayReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let debts: any = [];
        RestApi.getKnex().raw(`SELECT customer_debt.customer_id, customer.code AS customer_code, customer.customer_name, (coalesce(SUM(sale_diamond.subtotal), 0) + coalesce(SUM(sale_gold.subtotal), 0)) AS sale, SUM(balance) AS balance FROM customer_debt
                LEFT JOIN customer ON customer_debt.customer_id = customer.id
                LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                WHERE customer_debt.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND balance > 0
                GROUP BY customer_debt.customer_id`)
            .then((result) => {
                debts = result[0];
                console.log("debts ", debts);
                // let customer_id: any = [];
                // debts.forEach((debt: any) => {
                //     customer_id.push(debt.customer_id);
                // });
                // return RestApi.getKnex().raw(`SELECT customer_id, MIN(createddate) AS date, pay_amount from
                //             (SELECT customer_id, pay_amount, createddate FROM sale_diamond
                //             WHERE customer_id IN ('0eca83eb-f6b3-4a24-954e-ad13c2cacbd1', 'b94780fb-a791-4442-b886-c3edc10398de')
                //             UNION
                //             SELECT customer_id, pay_amount, createddate FROM sale_gold
                //             WHERE customer_id IN ('0eca83eb-f6b3-4a24-954e-ad13c2cacbd1', 'b94780fb-a791-4442-b886-c3edc10398de')) AS sale
                //             GROUP BY customer_id`)
                return RestApi.getKnex().raw(`SELECT customer_debt.customer_id, IF(ISNULL(sale_diamond_id), sale_gold.pay_amount, sale_diamond.pay_amount) AS opening, MIN(IF(ISNULL(sale_diamond_id), sale_gold.createddate, sale_diamond.createddate)) AS DATE FROM customer_debt
                            LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                            LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                            WHERE customer_debt.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND balance > 0
                            GROUP BY customer_debt.customer_id
                            ORDER BY customer_debt.date`)
            })
            .then((result) => {
                console.log("opening ", result[0]);
                debts.map((debt: any) => {
                    const detail = result[0].filter((opening: any) => {
                        return opening.customer_id == debt.customer_id;
                    });
                    console.log("detail ", detail);
                    debt.opening = detail[0].opening;
                    debt.receive = Number(debt.sale) - Number(debt.balance);
                });
                console.log("data ", debts);
                cb(undefined, {
                    data: debts
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getDebtGetReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        let debts: any = [];
        RestApi.getKnex().raw(`SELECT supplier.supplier_name, supplier.sale_person, SUM(whole_diamond.netprice_usd) AS purchase, settle.amount AS payment, SUM(diamond_debt.balance) AS balance FROM diamond_debt
            LEFT JOIN supplier ON diamond_debt.supplier_id = supplier.id
            LEFT JOIN whole_diamond ON wholediamond_id = whole_diamond.id
            LEFT JOIN (SELECT diamond_settlement.wholediamond_id, diamond_settlement.supplier_id, SUM(diamond_settlement.amount) AS amount FROM diamond_settlement
                JOIN diamond_debt ON diamond_settlement.wholediamond_id = diamond_debt.wholediamond_id
                WHERE diamond_debt.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND balance > 0
                GROUP BY diamond_settlement.supplier_id) settle 
            ON diamond_debt.supplier_id = settle.supplier_id
            WHERE diamond_debt.date BETWEEN '` + startDate + `' AND '` + endDate + `' AND balance > 0 
            GROUP BY diamond_debt.supplier_id`)
            .then((result) => {
                debts = result[0];
                console.log("debts ", debts);
                return RestApi.getKnex().raw(`SELECT t2.maxdate, t1.supplier_id, SUM(t1.amount) AS opening FROM
                                (SELECT id, DATE, supplier_id, netprice_usd AS amount FROM whole_diamond
                                WHERE supplier_id IN ('957c45a9-4ad0-41f8-9d19-e5df6c82f883', 'c58a77ae-3fb5-4843-9f22-7e164a976f74') AND DATE < '` + startDate + `' AND paymenttype = 'cash'
                                UNION
                                SELECT id, DATE, supplier_id, amount FROM diamond_settlement
                                WHERE supplier_id IN ('957c45a9-4ad0-41f8-9d19-e5df6c82f883', 'c58a77ae-3fb5-4843-9f22-7e164a976f74') AND DATE < '` + startDate + `') t1
                            INNER JOIN (
                                SELECT MAX(DATE) AS maxdate, supplier_id FROM
                                    (SELECT id, DATE, supplier_id, netprice_usd AS amount FROM whole_diamond
                                    WHERE supplier_id IN ('957c45a9-4ad0-41f8-9d19-e5df6c82f883', 'c58a77ae-3fb5-4843-9f22-7e164a976f74') AND DATE < '` + startDate + `' AND paymenttype = 'cash'
                                    UNION
                                    SELECT id, DATE, supplier_id, amount FROM diamond_settlement
                                    WHERE supplier_id IN ('957c45a9-4ad0-41f8-9d19-e5df6c82f883', 'c58a77ae-3fb5-4843-9f22-7e164a976f74') AND DATE < '` + startDate + `') open
                                GROUP BY supplier_id
                            ) t2
                            ON t1.supplier_id = t2.supplier_id AND t1.date = t2.maxdate
                            GROUP BY supplier_id`)
            })
            .then((result) => {
                console.log("opening ", result[0]);
                debts.map((debt: any) => {
                    const detail = result[0].filter((opening: any) => {
                        return opening.supplier_id == debt.supplier_id;
                    });
                    console.log("detail ", detail);
                    if (detail.length < 1)
                        debt.opening = 0;
                    else
                        debt.opening = detail[0].opening;
                });
                console.log("data ", debts);
                cb(undefined, {
                    data: debts
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getCashInOutProductionReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const type = args.type;
        console.log("type ", type);
        let debts: any = [];
        if (type == "in") {
            RestApi.getKnex().raw(`SELECT type, SUM(total_amount) AS total_amount, SUM(bank_amount) AS bank_amount, SUM(cash_amount) AS cash_amount FROM daily_cash_in
                    LEFT JOIN daily_cash_in_type ON daily_cash_in_type_id = daily_cash_in_type.id
                    WHERE daily_cash_in.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                    GROUP BY daily_cash_in_type_id`)
                .then((result) => {
                    console.log("data ", result[0]);
                    cb(undefined, {
                        data: result[0]
                    });
                })
                .catch((err) => {
                    cb(undefined, err);
                });
        } else {
            RestApi.getKnex().raw(`SELECT daily_cash_type.type, SUM(total_amount) AS total_amount, SUM(bank_amount) AS bank_amount, SUM(cash_amount) AS cash_amount FROM daily_usage
                    LEFT JOIN daily_cash_type ON daily_cash_type_id = daily_cash_type.id
                    WHERE daily_usage.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                    GROUP BY daily_cash_type_id`)
                .then((result) => {
                    console.log("data ", result[0]);
                    cb(undefined, {
                        data: result[0]
                    });
                })
                .catch((err) => {
                    cb(undefined, err);
                });
        }
    }

    public getCashInOutShowroomReport(args: any, cb: Function) {
        const startDate = Utils.toSqlDate(args.start);
        const endDate = Utils.toSqlDate(args.end);
        const type = args.type;
        console.log("type ", type);
        let debts: any = [];
        if (type == "in") {
            RestApi.getKnex().raw(`SELECT type, SUM(total_amount) AS total_amount, SUM(bank_amount) AS bank_amount, SUM(cash_amount) AS cash_amount FROM daily_cash_in_showroom
                    LEFT JOIN daily_cash_in_type ON daily_cash_in_type_id = daily_cash_in_type.id
                    WHERE daily_cash_in_showroom.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                    GROUP BY daily_cash_in_type_id`)
                .then((result) => {
                    console.log("data ", result[0]);
                    cb(undefined, {
                        data: result[0]
                    });
                })
                .catch((err) => {
                    cb(undefined, err);
                });
        } else {
            RestApi.getKnex().raw(`SELECT daily_cash_type.type, SUM(total_amount) AS total_amount, SUM(bank_amount) AS bank_amount, SUM(cash_amount) AS cash_amount FROM daily_usage_showroom
                    LEFT JOIN daily_cash_type ON daily_cash_type_id = daily_cash_type.id
                    WHERE daily_usage_showroom.date BETWEEN '` + startDate + `' AND '` + endDate + `'
                    GROUP BY daily_cash_type_id`)
                .then((result) => {
                    console.log("data ", result[0]);
                    cb(undefined, {
                        data: result[0]
                    });
                })
                .catch((err) => {
                    cb(undefined, err);
                });
        }
    }

    public getUsageShowroom(args: any, cb: Function) {
        const opts = {
            start: Utils.isEmpty(args["start"]) ? 0 : parseInt(`${args["start"]}`),
            length: Utils.isEmpty(args["length"]) ? 10 : parseInt(`${args["length"]}`),
            applySearch: (db: knex.QueryBuilder) => {
              if (!Utils.isEmpty(args["search"]) && !Utils.isEmpty(args.search["value"])) {
                const searchValue = `%${args.search.value}%`;
                db = db.where(function() {
                  this.orWhere("daily_usage_showroom.title", "like", searchValue)
                    .orWhere("daily_usage_showroom.total_amount", "like", searchValue);
                });
              }
              // return db.where({ "bundle.available": 1 });
              return db;
            },
            applyOrder: (db: knex.QueryBuilder) => {
              const colMap: any = {
                "id": "daily_usage_showroom.id",
                "title": "daily_usage_showroom.title",
                "total_amount": "daily_usage_showroom.total_amount",
                "type": "daily_cash_type.type"
              };
      
              if (!Utils.isEmpty(args["order"]) && !Utils.isEmpty(args["columns"]) && args.order.length > 0) {
                const colIdx = parseInt(args.order[0].column);
                const orderDir = args.order[0].dir.toUpperCase();
                const colName = args.columns[colIdx].data;
                if (colMap[colName]) {
                  if (colMap[colName] == "daily_usage_showroom.id") {
                    db = db.orderBy("daily_usage_showroom.date", "DESC");
                  } else {
                    db = db.orderBy(colMap[colName], orderDir);
                  }
                } else {
                  db = db.orderBy(colName, orderDir);
                }
              } else {
                db = db.orderBy("daily_usage_showroom.date", "DESC");
              }
              return db;
            }
        };

        const dataResult = {
            "draw": args.draw || 0,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": 0
        };
        RestApi.getDb().count({ total: "daily_usage_showroom.id" })
            .select().from("daily_usage_showroom")
            .then((result) => {
                dataResult.recordsTotal = (result.length > 0) ? result[0].total : 0;
        
                const dbCount = RestApi.getDb().count({ total: "daily_usage_showroom.id" })
                    .select().from("daily_usage_showroom");
        
                return opts.applySearch(dbCount);
            }).then((result) => {
                dataResult.recordsFiltered = (result.length > 0) ? result[0].total : 0;
          
                return new Promise((resolve, reject) => {
                  this.list(args, (err: any, resultData: any) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(resultData);
                    }
                  }, opts);
                });
            })
            .then((result: any) => {
                dataResult.data = result.usageview;
                cb(undefined, dataResult);
            })
            .catch((err) => {
                console.log(`${err}`);
                cb(err, dataResult);
            });
        // RestApi.getDb("daily_usage_showroom")
        //     .leftJoin("daily_cash_type", "daily_cash_type_id", "daily_cash_type.id")
        //     .select("daily_usage_showroom.id", "daily_usage_showroom.title", "total_amount", "daily_cash_type.type")
        //     .then((result) => {
        //         cb(undefined, {
        //             data: result
        //         });
        //     })
        //     .catch((err) => {
        //         cb(undefined, err);
        //     });
    }

    public list(args: any, cb: Function, opts: any = undefined) {
        const data: any = {
          bundleview: []
        };
        let dbQuery = RestApi.getDb()
            .column("daily_usage_showroom.id", "daily_usage_showroom.title", "total_amount", "daily_cash_type.type")
            .select().from("daily_usage_showroom")
            .leftJoin("daily_cash_type", "daily_cash_type_id", "daily_cash_type.id");
    
        if (opts) {
          if (typeof opts.applySearch == "function") {
            dbQuery = opts.applySearch(dbQuery);
          }
          if (typeof opts.applyOrder == "function") {
            dbQuery = opts.applyOrder(dbQuery);
          }
          if (opts.start) {
            dbQuery = dbQuery.offset(opts.start);
          }
          if (opts.length) {
            dbQuery = dbQuery.limit(opts.length);
          }
        } else {
          dbQuery = dbQuery.orderBy("daily_usage_showroom.date", "DESC");
        }
    
        dbQuery.then((result) => {
          data.usageview = result;
            cb(undefined, data);
          })
          .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
          });
    }
}

export default new ReportView();