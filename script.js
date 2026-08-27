const STORAGE_KEY = "caffTrackData";
const APP_VERSION = "1.1.2";

let data = loadData();
let devDate = null;


/* =========================
   DATA
========================= */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && parsed.days) {
                if (!Object.prototype.hasOwnProperty.call(parsed, "commitment")) {
                    parsed.commitment = null;
                }

                return parsed;
            }
        }
    } catch (error) {
        console.error("Could not load CaffTrack data.", error);
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
    const y = date.getFullYear();

    const m = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
        date.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function getDay(offset = 0) {
    const date = appDate();

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

    if (!Array.isArray(data.days[key].entries)) {
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


function commitToQuit() {
    if (hasCommitted()) {
        closeCommitment();
        showPage("home");
        return;
    }

    data.commitment = dateKey(new Date());

    saveData();

    closeCommitment();

    showPage("home");

    updateApp();
}


function closeCommitment() {
    const screen =
        document.getElementById(
            "commitmentScreen"
        );

    if (screen) {
        screen.classList.add("hidden");
    }
}


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
        screen.classList.remove("hidden");
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
            element.classList.add("hidden");
        }
    });

    const selected =
        document.getElementById(
            page + "Page"
        );

    if (selected) {
        selected.classList.remove("hidden");
    }

    const nav =
        document.querySelectorAll(
            ".nav-item"
        );

    nav.forEach(item => {
        item.classList.remove("active");
    });

    const index = {
        home: 0,
        history: 1,
        progress: 2,
        settings: 3
    }[page];

    if (nav[index]) {
        nav[index].classList.add("active");
    }

    if (page === "history") {
        renderHistory();
        preparePastDatePicker();
    }

    if (page === "progress") {
        renderProgress();
    }
}


/* =========================
   LOGGER
========================= */

function openLogger(selectedDate = null) {
    document
        .getElementById("logger")
        .classList.add("active");

    const dateInput =
        document.getElementById("drinkDate");

    if (dateInput) {
        dateInput.value =
            selectedDate ||
            dateKey(appDate());

        dateInput.max =
            dateKey(new Date());
    }

    selectTimeOfDay(
        getSuggestedTimeOfDay()
    );

    clearAmountSelection();

    const customInput =
        document.getElementById("customAmount");

    if (customInput) {
        customInput.value = "";
    }

    setTimeout(() => {
        const input =
            document.getElementById("drinkName");

        if (input) {
            input.focus();
        }
    }, 100);
}


function getSuggestedTimeOfDay() {
    const hour =
        appDate().getHours();

    if (hour < 12) {
        return "morning";
    }

    if (hour < 18) {
        return "afternoon";
    }

    return "night";
}


function selectTimeOfDay(time) {
    document
        .querySelectorAll(".time-button")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.time === time
            );
        });
}


function getSelectedTimeOfDay() {
    const selected =
        document.querySelector(
            ".time-button.selected"
        );

    return selected
        ? selected.dataset.time
        : getSuggestedTimeOfDay();
}


function closeLogger() {
    document
        .getElementById("logger")
        .classList.remove("active");
}


function addCaffeine(amount) {
    amount = Number(amount);

    if (!amount || amount <= 0) {
        return;
    }

    const nameInput =
        document.getElementById("drinkName");

    const name =
        nameInput.value.trim() ||
        "Caffeine";

    const dateInput =
        document.getElementById("drinkDate");

    const selectedDate =
        dateInput.value ||
        dateKey(appDate());

    const timeOfDay =
        getSelectedTimeOfDay();

    const day =
        getDayData(selectedDate);

    day.entries.push({
        id:
            Date.now().toString() +
            Math.random(),

        name:
            name,

        amount:
            amount,

        timeOfDay:
            timeOfDay
    });

    day.caffeine =
        day.entries.reduce(
            (total, entry) =>
                total +
                Number(entry.amount || 0),
            0
        );

    day.drinks =
        day.entries.length;

    saveData();

    closeLogger();

    nameInput.value = "";

    document
        .getElementById("customAmount")
        .value = "";

    clearAmountSelection();

    updateApp();
}


function selectAmount(amount) {
    const customInput =
        document.getElementById("customAmount");

    if (customInput) {
        customInput.value = amount;
    }

    document
        .querySelectorAll(".amount-grid button")
        .forEach(button => {
            const buttonAmount =
                Number(
                    button.textContent
                        .replace("mg", "")
                        .trim()
                );

            button.classList.toggle(
                "selected",
                buttonAmount === Number(amount)
            );
        });
}


function clearAmountSelection() {
    document
        .querySelectorAll(".amount-grid button")
        .forEach(button => {
            button.classList.remove("selected");
        });
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

    if (!amount || amount <= 0) {
        alert("Please enter a valid caffeine amount.");
        return;
    }

    addCaffeine(amount);
}


/* =========================
   PAST-DATE LOGGING
========================= */
function formatPastDate(input) {
    let numbers =
        input.value.replace(/\D/g, "");

    numbers =
        numbers.slice(0, 8);

    if (numbers.length >= 5) {
        input.value =
            numbers.slice(0, 2) +
            "/" +
            numbers.slice(2, 4) +
            "/" +
            numbers.slice(4);
    }

    else if (numbers.length >= 3) {
        input.value =
            numbers.slice(0, 2) +
            "/" +
            numbers.slice(2);
    }

    else {
        input.value = numbers;
    }
}

function preparePastDatePicker() {
    const input =
        document.getElementById(
            "pastDrinkDate"
        );

    if (!input) {
        return;
    }

    input.placeholder =
        "MM/DD/YYYY";
}


function pastDateSelected() {
    const input =
        document.getElementById(
            "pastDrinkDate"
        );

    if (!input) {
        return;
    }

    const value =
        input.value.trim();

    const match =
        value.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

    if (!match) {
        alert(
            "Enter the date as MM/DD/YYYY."
        );

        input.focus();

        return;
    }

    const month =
        Number(match[1]);

    const day =
        Number(match[2]);

    const year =
        Number(match[3]);

    const selected =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        selected.getFullYear() !== year ||
        selected.getMonth() !== month - 1 ||
        selected.getDate() !== day
    ) {
        alert(
            "Please enter a valid date."
        );

        return;
    }

    const today =
        new Date();

    today.setHours(
        23,
        59,
        59,
        999
    );

    if (selected > today) {
        alert(
            "You can't log caffeine for a future date."
        );

        return;
    }

    const selectedDate =
        dateKey(selected);

    openLogger(
        selectedDate
    );

    input.value = "";
}

/* =========================
   EDIT DRINK
========================= */

function editDrink(dayKey, id) {
    const day =
        data.days[dayKey];

    if (
        !day ||
        !Array.isArray(day.entries)
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

    const newName =
        prompt(
            "Drink name:",
            drink.name
        );

    if (newName === null) {
        return;
    }

    const cleanName =
        newName.trim();

    if (!cleanName) {
        alert(
            "Please enter a drink name."
        );

        return;
    }

    const newAmount =
        prompt(
            "Caffeine amount (mg):",
            drink.amount
        );

    if (newAmount === null) {
        return;
    }

    const amount =
        Number(newAmount);

    if (
        !amount ||
        amount <= 0
    ) {
        alert(
            "Please enter a valid caffeine amount."
        );

        return;
    }

    const currentTime =
        drink.timeOfDay || "morning";

    const newTime =
        prompt(
            "Time of day (morning, afternoon, or night):",
            currentTime
        );

    if (newTime === null) {
        return;
    }

    const cleanTime =
        newTime.trim().toLowerCase();

    if (
        ![
            "morning",
            "afternoon",
            "night"
        ].includes(cleanTime)
    ) {
        alert(
            "Please enter morning, afternoon, or night."
        );

        return;
    }

    drink.name = cleanName;
    drink.amount = amount;
    drink.timeOfDay = cleanTime;

    day.caffeine =
        day.entries.reduce(
            (total, entry) =>
                total +
                Number(entry.amount || 0),
            0
        );

    day.drinks =
        day.entries.length;

    saveData();

    updateApp();
}


/* =========================
   REMOVE DRINK
========================= */

function removeDrink(dayKey, id) {
    const day =
        data.days[dayKey];

    if (
        !day ||
        !Array.isArray(day.entries)
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
            (total, entry) =>
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

    let greeting;

    if (hour < 12) {
        greeting = "Good morning";
    }

    else if (hour < 17) {
        greeting = "Good afternoon";
    }

    else if (hour < 21) {
        greeting = "Good evening";
    }

    else {
        greeting = "Good night";
    }

    const name =
        localStorage.getItem(
            "caffTrackName"
        ) || "";

    const text =
        name
            ? `${greeting}, ${name}.`
            : `${greeting}.`;

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

    for (let i = -6; i <= 0; i++) {
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
                day => day.value
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
        commitmentDate();

    const end =
        new Date(appDate());

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let total = 0;

    const cursor =
        new Date(start);

    while (cursor <= end) {
        const key =
            dateKey(cursor);

        const caffeine =
            Number(
                data.days[key]?.caffeine ||
                0
            );

        if (caffeine === 0) {
            total++;
        }

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    return total;
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
        new Date(appDate());

    const start =
        commitmentDate();

    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    while (date >= start) {
        const key =
            dateKey(date);

        const day =
            data.days[key];

        if (
            day &&
            Number(day.caffeine) > 0
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

    const start =
        commitmentDate();

    const end =
        new Date(appDate());

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let current = 0;
    let best = 0;

    const cursor =
        new Date(start);

    while (cursor <= end) {
        const key =
            dateKey(cursor);

        const caffeine =
            Number(
                data.days[key]?.caffeine ||
                0
            );

        if (caffeine === 0) {
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

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    return best;
}


/* =========================
   WEEKLY TOTALS
========================= */

function sevenDayTotal() {
    let total = 0;

    for (let i = -6; i <= 0; i++) {
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

    for (let i = -13; i <= -7; i++) {
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
    return Math.round(
        sevenDayTotal() / 7
    );
}


/* =========================
   HISTORY
========================= */

function renderHistory() {
    setText(
        "historyWeekTotal",
        sevenDayTotal() + " mg"
    );

    setText(
        "historyFreeDays",
        freeDays() + " days"
    );

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
            .filter(key => {
                const day =
                    data.days[key];

                return (
                    Number(
                        day.caffeine || 0
                    ) > 0 ||
                    (
                        Array.isArray(
                            day.entries
                        ) &&
                        day.entries.length > 0
                    )
                );
            })
            .sort()
            .reverse();

    if (keys.length === 0) {
        const empty =
            document.createElement(
                "p"
            );

        empty.className =
            "page-description";

        empty.textContent =
            "No caffeine has been logged yet.";

        container.appendChild(empty);

        return;
    }

    keys.forEach(key => {
        const day =
            data.days[key];

        const date =
            new Date(
                key + "T00:00:00"
            );

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "history-day";

        const dateLabel =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                }
            );

        row.innerHTML = `
            <div class="history-left">

                <div class="history-icon">
                    ☕
                </div>

                <div class="history-info">

                    <strong>
                        ${dateLabel}
                    </strong>

                    <small>
                        ${day.drinks || 0}
                        ${
                            Number(day.drinks) === 1
                                ? "drink"
                                : "drinks"
                        }
                    </small>

                </div>

            </div>

            <div class="history-right">

                <strong>
                    ${Number(day.caffeine || 0)} mg
                </strong>

                <small>
                    total
                </small>

            </div>
        `;

        if (
            Array.isArray(day.entries) &&
            day.entries.length > 0
        ) {
            const drinkList =
                document.createElement(
                    "div"
                );

            drinkList.className =
                "history-drinks";

            day.entries.forEach(entry => {
                const drink =
                    document.createElement(
                        "div"
                    );

                drink.className =
                    "history-drink";

                const timeLabels = {
                    morning:
                        "☀️ Morning",

                    afternoon:
                        "🌤️ Afternoon",

                    night:
                        "🌙 Night"
                };

                const timeLabel =
                    timeLabels[
                        entry.timeOfDay
                    ] || "";

                drink.innerHTML = `
                    <div>

                        <strong>
                            ${escapeHTML(
                                entry.name ||
                                "Caffeine"
                            )}
                        </strong>

                        <small>
                            ${Number(
                                entry.amount || 0
                            )} mg
                            ${
                                timeLabel
                                    ? " · " +
                                      timeLabel
                                    : ""
                            }
                        </small>

                    </div>

                    <div class="history-actions">

                        <button
                            class="edit-button"
                            type="button"
                            onclick="editDrink(
                                '${key}',
                                '${String(
                                    entry.id
                                )}'
                            )"
                        >
                            Edit
                        </button>

                        <button
                            class="remove-button"
                            type="button"
                            onclick="removeDrink(
                                '${key}',
                                '${String(
                                    entry.id
                                )}'
                            )"
                            aria-label="Remove drink"
                        >
                            ×
                        </button>

                    </div>
                `;

                drinkList.appendChild(
                    drink
                );
            });

            row.appendChild(
                drinkList
            );
        }

        container.appendChild(
            row
        );
    });
}


/* =========================
   PROGRESS
========================= */

function renderProgress() {
    const totalLogged =
        Object.values(data.days)
            .reduce(
                (total, day) =>
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

    if (
        previous === 0 &&
        current === 0
    ) {
        change = "0%";
    }

    else if (
        previous === 0 &&
        current > 0
    ) {
        change = "New";
    }

    else if (previous > 0) {
        const difference =
            Math.round(
                (
                    (
                        current -
                        previous
                    ) /
                    previous
                ) * 100
            );

        change =
            difference === 0
                ? "0%"
                : (
                    difference > 0
                        ? "+" + difference + "%"
                        : difference + "%"
                );
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
        [1, "First caffeine-free day"],
        [2, "2 caffeine-free days"],
        [3, "3 caffeine-free days"],
        [7, "7 caffeine-free days"],
        [14, "14 caffeine-free days"],
        [30, "30 caffeine-free days"]
    ];

    milestones.forEach(item => {
        const complete =
            freeDays() >= item[0];

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
    });
}


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
        document.getElementById(
            "devButton"
        );

    const devPanel =
        document.getElementById(
            "devPanel"
        );

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
        document.getElementById(
            "devPanel"
        );

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
        document.getElementById(
            "devDate"
        );

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

    link.href = url;

    link.download =
        "cafftrack-backup.json";

    link.click();

    URL.revokeObjectURL(url);
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
                    !imported ||
                    typeof imported !== "object" ||
                    !imported.days ||
                    typeof imported.days !== "object"
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

                normalizeData();

                saveData();

                updateApp();

                if (!hasCommitted()) {
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

    localStorage.removeItem(
        "caffTrackName"
    );

    saveData();

    const nameInput =
        document.getElementById(
            "nameInput"
        );

    if (nameInput) {
        nameInput.value = "";
    }

    const commitmentName =
        document.getElementById(
            "commitmentName"
        );

    if (commitmentName) {
        commitmentName.value = "";
    }

    updateApp();

    showCommitment();

    alert(
        "CaffTrack has been reset."
    );
}


/* =========================
   APPEARANCE
========================= */

function applyAppearance(mode) {
    document.body.classList.remove(
        "dark-mode"
    );

    if (mode === "dark") {
        document.body.classList.add(
            "dark-mode"
        );

        return;
    }

    if (
        mode === "system" &&
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ) {
        document.body.classList.add(
            "dark-mode"
        );
    }
}


function changeAppearance(mode) {
    localStorage.setItem(
        "caffTrackAppearance",
        mode
    );

    applyAppearance(mode);
}


function loadAppearance() {
    const mode =
        localStorage.getItem(
            "caffTrackAppearance"
        ) || "system";

    applyAppearance(mode);

    const select =
        document.getElementById(
            "appearanceSelect"
        );

    if (select) {
        select.value = mode;
    }
}


function setupSystemAppearanceListener() {
    if (!window.matchMedia) {
        return;
    }

    const media =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

    media.addEventListener(
        "change",
        () => {
            const mode =
                localStorage.getItem(
                    "caffTrackAppearance"
                ) || "system";

            if (mode === "system") {
                applyAppearance(
                    "system"
                );
            }
        }
    );
}


/* =========================
   PERSONALIZATION
========================= */

function saveName(name) {
    name = name.trim();

    localStorage.setItem(
        "caffTrackName",
        name
    );

    updateGreeting();
}


function loadName() {
    const name =
        localStorage.getItem(
            "caffTrackName"
        ) || "";

    const input =
        document.getElementById(
            "nameInput"
        );

    if (input) {
        input.value = name;
    }

    updateGreeting();
}


function commitWithName() {
    const input =
        document.getElementById(
            "commitmentName"
        );

    const name =
        input.value.trim();

    if (!name) {
        input.focus();

        input.placeholder =
            "Please enter your name";

        return;
    }

    saveName(name);

    commitToQuit();
}


/* =========================
   DATA NORMALIZATION
========================= */

function normalizeData() {
    if (
        !data ||
        typeof data !== "object"
    ) {
        data = {
            days: {},
            commitment: null
        };
    }

    if (
        !data.days ||
        typeof data.days !== "object"
    ) {
        data.days = {};
    }

    if (
        !Object.prototype
            .hasOwnProperty
            .call(
                data,
                "commitment"
            )
    ) {
        data.commitment = null;
    }

    Object.keys(data.days)
        .forEach(key => {
            const day =
                data.days[key];

            if (
                !day ||
                typeof day !== "object"
            ) {
                data.days[key] = {
                    caffeine: 0,
                    drinks: 0,
                    entries: []
                };

                return;
            }

            if (
                !Array.isArray(
                    day.entries
                )
            ) {
                day.entries = [];
            }

            day.entries.forEach(
                entry => {
                    if (!entry.id) {
                        entry.id =
                            Date.now()
                                .toString() +
                            Math.random();
                    }

                    entry.name =
                        String(
                            entry.name ||
                            "Caffeine"
                        );

                    entry.amount =
                        Number(
                            entry.amount ||
                            0
                        );

                    if (
                        ![
                            "morning",
                            "afternoon",
                            "night"
                        ].includes(
                            entry.timeOfDay
                        )
                    ) {
                        delete entry.timeOfDay;
                    }
                }
            );

            if (
                day.entries.length > 0
            ) {
                day.caffeine =
                    day.entries.reduce(
                        (
                            total,
                            entry
                        ) =>
                            total +
                            Number(
                                entry.amount ||
                                0
                            ),
                        0
                    );

                day.drinks =
                    day.entries.length;
            }

            else {
                day.caffeine =
                    Number(
                        day.caffeine ||
                        0
                    );

                day.drinks =
                    Number(
                        day.drinks ||
                        0
                    );
            }
        });
}


/* =========================
   HELPERS
========================= */

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   UPDATE EVERYTHING
========================= */

function updateApp() {
    normalizeData();

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
   APP VERSION / PWA
========================= */

function registerServiceWorker() {
    if (
        "serviceWorker" in navigator &&
        location.protocol !== "file:"
    ) {
        window.addEventListener(
            "load",
            () => {
                navigator.serviceWorker
                    .register(
                        "./service-worker.js"
                    )
                    .catch(error => {
                        console.error(
                            "Service worker registration failed.",
                            error
                        );
                    });
            }
        );
    }
}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        normalizeData();

        loadAppearance();

        loadName();

        setupSystemAppearanceListener();

        updateApp();

        setupDevMode();

        preparePastDatePicker();

        registerServiceWorker();

        if (hasCommitted()) {
            closeCommitment();
        }

        else {
            showCommitment();
        }
    }
);