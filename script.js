const STORAGE_KEY = "caffTrackData";
const APP_VERSION = "1.0.0";

let data = loadData();
let devDate = null;


/* =========================
   DATA
========================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {

            const parsed =
                JSON.parse(saved);

            if (
                parsed &&
                parsed.days
            ) {

                if (
                    !Object.prototype.hasOwnProperty
                        .call(
                            parsed,
                            "commitment"
                        )
                ) {

                    parsed.commitment = null;

                }

                return parsed;

            }

        }

    }

    catch (error) {

        console.error(
            "Could not load CaffTrack data.",
            error
        );

    }


    return {
        days: {},
        commitment: null
    };

}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =========================
   DATES
========================= */

function appDate() {

    return devDate
        ? new Date(devDate)
        : new Date();

}


function dateKey(date) {

    const y =
        date.getFullYear();

    const m =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;

}


function getDay(offset = 0) {

    const date =
        appDate();

    date.setDate(
        date.getDate() + offset
    );

    return date;

}


function getDayData(
    key = dateKey(appDate())
) {

    if (!data.days[key]) {

        data.days[key] = {
            caffeine: 0,
            drinks: 0,
            entries: []
        };

    }


    if (
        !Array.isArray(
            data.days[key].entries
        )
    ) {

        data.days[key].entries = [];

    }


    return data.days[key];

}


/* =========================
   COMMITMENT
========================= */

function hasCommitted() {

    return !!data.commitment;

}


function commitmentDate() {

    if (!data.commitment) {
        return null;
    }


    return new Date(
        data.commitment + "T00:00:00"
    );

}


/*
   THIS IS THE IMPORTANT FIX.

   The HTML button calls commitToQuit()
   directly.

   This function saves the commitment,
   hides the commitment screen, and
   opens the home page.
*/

function commitToQuit() {

    console.log(
        "CaffTrack commitment button clicked."
    );


    if (hasCommitted()) {

        closeCommitment();

        showPage("home");

        return;

    }


    data.commitment =
        dateKey(new Date());


    saveData();


    closeCommitment();


    showPage("home");


    updateApp();

}


/*
   Hide the ORIGINAL commitment screen.

   We are no longer creating a second
   commitment overlay dynamically.
*/

function closeCommitment() {

    const screen =
        document.getElementById(
            "commitmentScreen"
        );


    if (screen) {

        screen.classList.add(
            "hidden"
        );

    }

}


/*
   Show the ORIGINAL commitment screen.
*/

function showCommitment() {

    if (hasCommitted()) {

        closeCommitment();

        return;

    }


    const screen =
        document.getElementById(
            "commitmentScreen"
        );


    if (screen) {

        screen.classList.remove(
            "hidden"
        );

    }

}


/* =========================
   NAVIGATION
========================= */

function showPage(page) {

    const pages = [
        "homePage",
        "historyPage",
        "progressPage",
        "settingsPage"
    ];


    pages.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.classList.add(
                "hidden"
            );

        }

    });


    const selected =
        document.getElementById(
            page + "Page"
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );

    }


    const nav =
        document.querySelectorAll(
            ".nav-item"
        );


    nav.forEach(item => {

        item.classList.remove(
            "active"
        );

    });


    const index = {
        home: 0,
        history: 1,
        progress: 2,
        settings: 3
    }[page];


    if (nav[index]) {

        nav[index].classList.add(
            "active"
        );

    }


    if (page === "history") {

        renderHistory();

    }


    if (page === "progress") {

        renderProgress();

    }

}


/* =========================
   LOGGER
========================= */

function openLogger() {

    document
        .getElementById("logger")
        .classList.add("active");


    setTimeout(() => {

        const input =
            document.getElementById(
                "drinkName"
            );


        if (input) {

            input.focus();

        }

    }, 100);

}


function closeLogger() {

    document
        .getElementById("logger")
        .classList.remove("active");

}


function addCaffeine(amount) {

    amount =
        Number(amount);


    if (
        !amount ||
        amount <= 0
    ) {

        return;

    }


    const nameInput =
        document.getElementById(
            "drinkName"
        );


    const name =
        nameInput.value.trim() ||
        "Caffeine";


    const day =
        getDayData();


    day.entries.push({

        id:
            Date.now().toString() +
            Math.random(),

        name:
            name,

        amount:
            amount

    });


    day.caffeine += amount;


    day.drinks =
        day.entries.length;


    saveData();


    closeLogger();


    document
        .getElementById(
            "drinkName"
        )
        .value = "";


    document
        .getElementById(
            "customAmount"
        )
        .value = "";


    updateApp();

}


function addCustom() {

    const amount =
        Number(
            document
                .getElementById(
                    "customAmount"
                )
                .value
        );


    addCaffeine(amount);

}


/* =========================
   REMOVE DRINK
========================= */

function removeDrink(
    dayKey,
    id
) {

    const day =
        data.days[dayKey];


    if (
        !day ||
        !Array.isArray(
            day.entries
        )
    ) {

        return;

    }


    const drink =
        day.entries.find(
            entry =>
                String(entry.id) ===
                String(id)
        );


    if (!drink) {

        return;

    }


    if (
        !confirm(
            `Remove "${drink.name}" (${drink.amount} mg)?`
        )
    ) {

        return;

    }


    day.entries =
        day.entries.filter(
            entry =>
                String(entry.id) !==
                String(id)
        );


    day.caffeine =
        day.entries.reduce(
            (
                total,
                entry
            ) =>
                total +
                Number(
                    entry.amount || 0
                ),
            0
        );


    day.drinks =
        day.entries.length;


    saveData();


    updateApp();


    renderHistory();

}


/* =========================
   HOME
========================= */

function updateHome() {

    const today =
        getDayData();


    const total =
        sevenDayTotal();


    setText(
        "todayCaffeine",
        today.caffeine
    );


    setText(
        "drinkCount",
        today.drinks
    );


    setText(
        "streak",
        caffeineFreeStreak()
    );


    setText(
        "weeklyTotal",
        total + " mg"
    );


    setText(
        "weeklyTotalStats",
        total
    );


    setText(
        "freeDays",
        freeDays()
    );


    setText(
        "freeDaysSince",
        freeDaysSince()
    );

}


/* =========================
   GREETING
========================= */

function updateGreeting() {

    const hour =
        appDate().getHours();


    let text;


    if (hour < 12) {

        text =
            "Good morning.";

    }

    else if (hour < 17) {

        text =
            "Good afternoon.";

    }

    else if (hour < 21) {

        text =
            "Good evening.";

    }

    else {

        text =
            "Good night.";

    }


    setText(
        "greeting",
        text
    );

}


/* =========================
   ENCOURAGEMENT
========================= */

function updateEncouragement() {

    const today =
        getDayData();


    const streak =
        caffeineFreeStreak();


    let message;


    if (streak >= 30) {

        message =
            "🏆 Thirty days. You've built something seriously strong.";

    }

    else if (streak >= 14) {

        message =
            "🔥 Two weeks caffeine-free. That's a huge milestone.";

    }

    else if (streak >= 7) {

        message =
            "🔥 Seven days. You've built a real habit.";

    }

    else if (streak >= 3) {

        message =
            "🌱 Three days. You're building momentum.";

    }

    else if (streak === 2) {

        message =
            "🔥 Two days down. Keep going.";

    }

    else if (streak === 1) {

        message =
            "🌱 Day one. One day at a time.";

    }

    else if (today.caffeine === 0) {

        message =
            "💙 No caffeine today. That's a win.";

    }

    else {

        message =
            "🌱 Keep tracking. Progress doesn't require perfection.";

    }


    setText(
        "encouragementText",
        message
    );

}


/* =========================
   WEEKLY CHART
========================= */

function renderChart() {

    const container =
        document.getElementById(
            "weeklyBars"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const days = [];


    for (
        let i = -6;
        i <= 0;
        i++
    ) {

        const date =
            getDay(i);


        const key =
            dateKey(date);


        const value =
            data.days[key]?.caffeine ||
            0;


        days.push({
            date,
            key,
            value
        });

    }


    const max =
        Math.max(
            400,
            ...days.map(
                day =>
                    day.value
            )
        );


    days.forEach(day => {

        const column =
            document.createElement(
                "div"
            );


        column.className =
            "bar-column";


        const bar =
            document.createElement(
                "div"
            );


        bar.className =
            "bar";


        if (
            day.key ===
            dateKey(appDate())
        ) {

            bar.classList.add(
                "today-bar"
            );

        }


        const height =
            day.value === 0
                ? 5
                : Math.max(
                    8,
                    (
                        day.value /
                        max
                    ) * 75
                );


        bar.style.height =
            height + "px";


        bar.title =
            day.value + " mg";


        const label =
            document.createElement(
                "span"
            );


        label.textContent =
            day.date
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                )
                .charAt(0);


        column.appendChild(bar);

        column.appendChild(label);

        container.appendChild(column);

    });

}


/* =========================
   FREE DAYS
========================= */

function freeDays() {

    if (!hasCommitted()) {

        return 0;

    }


    const start =
        data.commitment;


    return Object.keys(data.days)
        .filter(key => {

            return (
                key >= start &&
                Number(
                    data.days[key].caffeine
                ) === 0
            );

        })
        .length;

}


function freeDaysSince() {

    if (!hasCommitted()) {

        return "Not started";

    }


    const date =
        commitmentDate();


    return "Since " +
        date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

}


/* =========================
   STREAKS
========================= */

function caffeineFreeStreak() {

    if (!hasCommitted()) {

        return 0;

    }


    let streak = 0;


    const date =
        appDate();


    const start =
        commitmentDate();


    while (
        date >= start
    ) {

        const key =
            dateKey(date);


        const day =
            data.days[key];


        if (
            day &&
            Number(
                day.caffeine
            ) > 0
        ) {

            break;

        }


        streak++;


        date.setDate(
            date.getDate() - 1
        );

    }


    return streak;

}


function bestStreak() {

    if (!hasCommitted()) {

        return 0;

    }


    const keys =
        Object.keys(data.days)
            .filter(
                key =>
                    key >=
                    data.commitment
            )
            .sort();


    let best = 0;

    let current = 0;


    keys.forEach(key => {

        if (
            Number(
                data.days[key].caffeine
            ) === 0
        ) {

            current++;

            best =
                Math.max(
                    best,
                    current
                );

        }

        else {

            current = 0;

        }

    });


    return best;

}


/* =========================
   WEEKLY TOTALS
========================= */

function sevenDayTotal() {

    let total = 0;


    for (
        let i = -6;
        i <= 0;
        i++
    ) {

        const key =
            dateKey(
                getDay(i)
            );


        total +=
            Number(
                data.days[key]?.caffeine ||
                0
            );

    }


    return total;

}


function previousSevenDayTotal() {

    let total = 0;


    for (
        let i = -13;
        i <= -7;
        i++
    ) {

        const key =
            dateKey(
                getDay(i)
            );


        total +=
            Number(
                data.days[key]?.caffeine ||
                0
            );

    }


    return total;

}


function weeklyAverage() {

    let total = 0;


    for (
        let i = -6;
        i <= 0;
        i++
    ) {

        const key =
            dateKey(
                getDay(i)
            );


        total +=
            Number(
                data.days[key]?.caffeine ||
                0
            );

    }


    return Math.round(
        total / 7
    );

}


/* =========================
   HISTORY
========================= */

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const keys =
        Object.keys(data.days)
            .sort()
            .reverse();


    keys.forEach(key => {

        const day =
            data.days[key];


        const free =
            Number(
                day.caffeine
            ) === 0;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "history-day";


        const left =
            document.createElement(
                "div"
            );


        left.className =
            "history-left";


        left.innerHTML = `

            <div class="history-icon">
                ${free ? "🌱" : "☕"}
            </div>

            <div class="history-info">

                <strong>
                    ${
                        key ===
                        dateKey(appDate())
                            ? "Today"
                            : formatDate(key)
                    }
                </strong>

                <small>
                    ${
                        free
                            ? "Caffeine-free"
                            : day.drinks +
                              " drink" +
                              (
                                  day.drinks === 1
                                      ? ""
                                      : "s"
                              )
                    }
                </small>

            </div>

        `;


        const right =
            document.createElement(
                "div"
            );


        right.className =
            "history-right";


        right.innerHTML = `

            <strong>
                ${day.caffeine} mg
            </strong>

            <small>
                ${free ? "Great job!" : "logged"}
            </small>

        `;


        card.appendChild(left);

        card.appendChild(right);


        if (
            day.entries.length
        ) {

            const drinks =
                document.createElement(
                    "div"
                );


            drinks.className =
                "history-drinks";


            day.entries.forEach(
                entry => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "history-drink";


                    const info =
                        document.createElement(
                            "div"
                        );


                    info.innerHTML = `

                        <strong>
                            ${escapeHTML(
                                entry.name
                            )}
                        </strong>

                        <small>
                            ${entry.amount} mg
                        </small>

                    `;


                    const remove =
                        document.createElement(
                            "button"
                        );


                    remove.className =
                        "remove-button";


                    remove.textContent =
                        "×";


                    remove.title =
                        "Remove drink";


                    remove.type =
                        "button";


                    remove.onclick =
                        () =>
                            removeDrink(
                                key,
                                entry.id
                            );


                    row.appendChild(info);

                    row.appendChild(remove);

                    drinks.appendChild(row);

                }
            );


            card.appendChild(drinks);

        }


        container.appendChild(card);

    });


    setText(
        "historyWeekTotal",
        sevenDayTotal() + " mg"
    );


    setText(
        "historyFreeDays",
        freeDays() +
        (
            freeDays() === 1
                ? " day"
                : " days"
        )
    );

}


function formatDate(key) {

    const date =
        new Date(
            key + "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================
   PROGRESS
========================= */

function renderProgress() {

    const totalLogged =
        Object.values(data.days)
            .reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    Number(
                        day.caffeine || 0
                    ),
                0
            );


    const previous =
        previousSevenDayTotal();


    const current =
        sevenDayTotal();


    let change = "—";


    if (previous > 0) {

        change =
            Math.round(
                (
                    (
                        previous -
                        current
                    ) /
                    previous
                ) * 100
            ) + "%";

    }


    setText(
        "progressStreak",
        caffeineFreeStreak()
    );


    setText(
        "bestStreak",
        bestStreak()
    );


    setText(
        "progressFreeDays",
        freeDays()
    );


    setText(
        "weeklyAverage",
        weeklyAverage()
    );


    setText(
        "totalLogged",
        totalLogged
    );


    setText(
        "weeklyChange",
        change
    );


    renderMilestones();

}


/* =========================
   MILESTONES
========================= */

function renderMilestones() {

    const container =
        document.getElementById(
            "milestones"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const milestones = [

        [
            1,
            "First caffeine-free day"
        ],

        [
            2,
            "2 caffeine-free days"
        ],

        [
            3,
            "3 caffeine-free days"
        ],

        [
            7,
            "7 caffeine-free days"
        ],

        [
            14,
            "14 caffeine-free days"
        ],

        [
            30,
            "30 caffeine-free days"
        ]

    ];


    milestones.forEach(
        item => {

            const complete =
                freeDays() >=
                item[0];


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "milestone" +
                (
                    complete
                        ? " complete"
                        : ""
                );


            row.innerHTML = `

                <div class="milestone-check">
                    ${
                        complete
                            ? "✓"
                            : item[0]
                    }
                </div>

                <div>

                    <strong>
                        ${item[1]}
                    </strong>

                    <small>
                        ${
                            complete
                                ? "Completed"
                                : "Keep going"
                        }
                    </small>

                </div>

            `;


            container.appendChild(row);

        }
    );

}


/* =========================
   DEV MODE
========================= */

/* =========================
   DEV MODE
========================= */

function isLocalVersion() {

    return (
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
    );

}


function setupDevMode() {

    const devButton =
        document.getElementById("devButton");

    const devPanel =
        document.getElementById("devPanel");

    if (!isLocalVersion()) {

        if (devButton) {
            devButton.remove();
        }

        if (devPanel) {
            devPanel.remove();
        }

        return;
    }

    updateDev();

}


function toggleDev() {

    if (!isLocalVersion()) {
        return;
    }

    const panel =
        document.getElementById("devPanel");

    if (!panel) {
        return;
    }

    panel.style.display =
        panel.style.display === "block"
            ? "none"
            : "block";

    updateDev();

}


function changeDevDay(amount) {

    if (!isLocalVersion()) {
        return;
    }

    const date =
        appDate();

    date.setDate(
        date.getDate() + amount
    );

    devDate = date;

    updateApp();

}


function resetDev() {

    if (!isLocalVersion()) {
        return;
    }

    devDate = null;

    updateApp();

}


function updateDev() {

    const date =
        document.getElementById("devDate");

    if (!date) {
        return;
    }

    date.textContent =
        appDate().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

}

/* =========================
   SETTINGS
========================= */

function exportData() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "cafftrack-backup.json";


    link.click();


    URL.revokeObjectURL(
        url
    );

}


function importData(file) {

    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const imported =
                    JSON.parse(
                        event.target.result
                    );


                if (
                    !imported.days
                ) {

                    throw new Error(
                        "Invalid data"
                    );

                }


                if (
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            imported,
                            "commitment"
                        )
                ) {

                    imported.commitment =
                        null;

                }


                data =
                    imported;


                saveData();


                updateApp();


                if (
                    !hasCommitted()
                ) {

                    showCommitment();

                }


                alert(
                    "CaffTrack data restored."
                );

            }

            catch {

                alert(
                    "That file could not be imported."
                );

            }

        };


    reader.readAsText(file);

}


function resetData() {

    if (
        !confirm(
            "Are you sure you want to erase all CaffTrack data?"
        )
    ) {

        return;

    }


    data = {
        days: {},
        commitment: null
    };


    saveData();


    updateApp();


    showCommitment();


    alert(
        "CaffTrack has been reset."
    );

}


/* =========================
   HELPERS
========================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================
   UPDATE EVERYTHING
========================= */

function updateApp() {

    getDayData();

    saveData();

    updateGreeting();

    updateHome();

    updateEncouragement();

    renderChart();

    renderHistory();

    renderProgress();

    updateDev();

}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateApp();


        /*
           If the user has already committed,
           don't show the commitment screen.
        */

        if (
            hasCommitted()
        ) {

            closeCommitment();

        }

        else {

            showCommitment();

        }

    }
);


/* =========================
   ESCAPE CLOSES LOGGER
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupDevMode();

        updateApp();

        setTimeout(
            showCommitment,
            100
        );

    }
);
