import $ = require("jquery")
import moment = require("moment")

const types: any = {
    Date: {
        format: "YYYY-MM-DD"
    },
    Time: {
        format: "HH:mm:ss"
    },
    DateTime: {
        format: "YYYY-MM-DD HH:mm:ss"
    }
}

interface Options {
    startYear?: number
    endYear?: number
}

export function showDatePicker(type: string, value: string | Date | null,
    options: Options, callback: (date: Date, dateStr: string) => void) {

    console.log("date picker, init value: " + value)

    const typeDef = types[type]
    if (!typeDef) return

    let oldMoment: moment.Moment
    if (value) {
        oldMoment = value instanceof Date ? moment(value)
            : moment(value, typeDef.format)
    } else {
        oldMoment = moment()
    }
    if (!oldMoment.isValid()) oldMoment = moment()

    const oldYear = oldMoment.year()
    const oldMonth = oldMoment.month()
    const oldDate = oldMoment.date()
    const oldHour = oldMoment.hour()
    const oldMinute = oldMoment.minute()
    const oldSecond = oldMoment.second()
    const startYear = options.startYear || oldYear - 10
    const endYear = options.endYear || oldYear + 10

    const jadeCtx = {type, oldYear, oldMonth, oldDate,
        oldHour, oldMinute, oldSecond, startYear, endYear}
    console.log(jadeCtx)
    const $datePicker = $(ST.DatePicker(jadeCtx)).appendTo($("body"))

    if (type === "Date" || type === "DateTime") {
        initDatePart($datePicker)
    }

    $datePicker.mustFindOne(".confirm").click(function() {
        let mm: moment.Moment

        if (type === "Date" || type === "DateTime") {
            const $selectYear = $datePicker.mustFindOne(".select-year")
            const $selectMonth = $datePicker.mustFindOne(".select-month")
            const $table = $datePicker.mustFindOne("table")

            const $this = $table.find("td.selected")
            if ($this.length) {
                const d = parseInt($this.text(), 10)
                const year = parseInt($selectYear.val() as string, 10)
                const month = parseInt($selectMonth.val() as string, 10)

                if ($this.hasClass("next-month")) {
                    mm = moment({y: year, M: month, d: 1}).add(1, "M").date(d)
                } else if ($this.hasClass("last-month")) {
                    mm = moment({y: year, M: month, d: 1}).add(-1, "M").date(d)
                } else {
                    mm = moment({y: year, M: month, d})
                }
            } else {
                mm = oldMoment
            }
        } else {
            mm = moment()
        }

        if (type === "Time" || type === "DateTime") {
            const $h = $datePicker.mustFindOne(".select-hour")
            const $m = $datePicker.mustFindOne(".select-minute")
            const $s = $datePicker.mustFindOne(".select-second")
            const h = parseInt($h.val() as string, 10)
            const m = parseInt($m.val() as string, 10)
            const s = parseInt($s.val() as string, 10)
            mm.set("hour", h).set("minute", m).set("second", s)
        }

        callback(mm.toDate(), mm.format(typeDef.format))
        $datePicker.remove()
    })

    $datePicker.mustFindOne(".cancel").click(function() {
        $datePicker.remove()
    })
}

function initDatePart($datePicker: JQuery) {
    const todayM = moment()
    const todayYear = todayM.year()
    const todayMonth = todayM.month()
    const todayDate = todayM.date()

    const $selectYear = $datePicker.mustFindOne(".select-year")
    const $selectMonth = $datePicker.mustFindOne(".select-month")
    const $table = $datePicker.mustFindOne("table")

    $selectYear.on("change", renderDaysTable)
    $selectMonth.on("change", renderDaysTable)

    $datePicker.mustFindOne("a.prev-month").click(function() {
        const m = parseInt($selectMonth.val() as string, 10)
        if (m === 0) {
            $selectYear.val(parseInt($selectYear.val() as string, 10) - 1)
            $selectMonth.val(11)
        } else {
            $selectMonth.val(m - 1)
        }
        renderDaysTable()
    })

    $datePicker.find("a.next-month").click(function() {
        const m = parseInt($selectMonth.val() as string, 10)
        if (m === 11) {
            $selectYear.val(parseInt($selectYear.val() as string, 10) + 1)
            $selectMonth.val(0)
        } else {
            $selectMonth.val(m + 1)
        }
        renderDaysTable()
    })

    $table.on("click", "td", function() {
        $table.find("td").removeClass("selected")
        $(this).addClass("selected")
    })

    function renderDaysTable() {
        const renderingDays: number[] = []
        const year = parseInt($selectYear.val() as string, 10)
        const month = parseInt($selectMonth.val() as string, 10)
        const firstDayOfMonth = moment({y: year, M: month, d: 1})
        let firstWeekDay = firstDayOfMonth.day()
        if (firstWeekDay === 0) firstWeekDay = 7 // Sunday 从前改到后
        const lastMonthRestDays = firstWeekDay - 1 // 上一个月在表格中显示几个
        if (lastMonthRestDays) {
            const lastMonthLastDate = firstDayOfMonth.clone()
                .subtract(1, "months").endOf("month").date()
            for (let i = 1; i <= lastMonthRestDays; i++) {
                renderingDays.push(lastMonthLastDate - (lastMonthRestDays - i))
            }
        }

        const daysInThisMonth = firstDayOfMonth.daysInMonth()
        for (let i = 1; i <= daysInThisMonth; i++) {
            renderingDays.push(i)
        }

        const nextMonthAheadDays = 7 - (lastMonthRestDays + daysInThisMonth) % 7
        if (nextMonthAheadDays !== 7) {
            for (let i = 1; i <= nextMonthAheadDays; i++) {
                renderingDays.push(i)
            }
        }

        const $tbody = $datePicker.mustFindOne("tbody.date").empty()
        let classString = "last-month"
        const rows = renderingDays.length / 7
        for (let r = 0; r < rows; r++) {
            const $tr = $("<tr>").appendTo($tbody)
            for (let c = 0; c < 7; c++) {
                const i = r * 7 + c
                const d = renderingDays[i]
                if (classString === "last-month" && d === 1) {
                    classString = "this-month"
                } else if (classString === "this-month" && d === 1) {
                    classString = "next-month"
                }

                const $td = $("<td>", {html: d, class: classString})
                    .appendTo($tr)

                if (todayYear === year && todayMonth === month
                    && todayDate === d) {
                    $td.addClass("today")
                }

                if (todayYear === year && todayMonth === month
                    && todayDate === d) {
                    $td.addClass("today")
                }
            }
        }
    }
    renderDaysTable()
}
