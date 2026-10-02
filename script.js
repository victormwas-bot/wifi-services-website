/* =========================================================
   NETCONNECT MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const navLinks =
    document.querySelector(".nav-links");


if (menuButton && navLinks) {

    menuButton.addEventListener("click", () => {

        navLinks.classList.toggle("open");

    });


    navLinks.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("open");

        });

    });

}


/* =========================================================
   VISITOR TRACKING
========================================================= */

let visitorId =
    localStorage.getItem(
        "netconnectVisitorId"
    );


async function sendVisitorHeartbeat() {

    try {

        const response =
            await fetch(
                "/api/visitor/heartbeat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        visitorId
                    })
                }
            );


        if (!response.ok) {

            console.log(
                "Visitor heartbeat failed"
            );

            return;

        }


        const data =
            await response.json();


        if (data.visitorId) {

            visitorId =
                data.visitorId;

            localStorage.setItem(
                "netconnectVisitorId",
                visitorId
            );

        }


        console.log(
            "Visitor tracking active"
        );

    }

    catch (error) {

        console.log(
            "Visitor tracking error:",
            error
        );

    }

}


sendVisitorHeartbeat();


setInterval(
    sendVisitorHeartbeat,
    4000
);


window.addEventListener(
    "beforeunload",
    () => {

        if (!visitorId) {

            return;

        }


        const data =
            JSON.stringify({
                visitorId
            });


        navigator.sendBeacon(

            "/api/visitor/leave",

            new Blob(
                [data],
                {
                    type:
                        "application/json"
                }
            )

        );

    }
);


/* =========================================================
   PROVIDERS
========================================================= */

let providers = [];

let activeProviderFilter =
    "all";


async function loadProviders() {

    const providerList =
        document.getElementById(
            "providerList"
        );


    try {

        const response =
            await fetch(
                "/api/providers"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load providers"
            );

        }


        providers =
            await response.json();


        updateProviderCounters();

        renderProviders();

    }

    catch (error) {

        console.error(error);


        if (providerList) {

            providerList.innerHTML = `

                <div class="loading-card glass-card">

                    <div class="glass-icon">

                        <svg viewBox="0 0 24 24">

                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                            />

                            <path
                                d="M12 8V13"
                            />

                            <circle
                                cx="12"
                                cy="17"
                                r="1"
                            />

                        </svg>

                    </div>

                    <p>
                        Could not load providers.
                    </p>

                </div>

            `;

        }

    }

}


function updateProviderCounters() {

    const providerCount =
        document.getElementById(
            "providerCount"
        );


    const heroProviderCount =
        document.getElementById(
            "heroProviderCount"
        );


    const aboutProviderCount =
        document.getElementById(
            "aboutProviderCount"
        );


    const count =
        providers.length;


    if (providerCount) {

        providerCount.textContent =
            count;

    }


    if (heroProviderCount) {

        heroProviderCount.textContent =
            `${count}+`;

    }


    if (aboutProviderCount) {

        aboutProviderCount.textContent =
            count;

    }

}


/* =========================================================
   PROVIDER ICON
========================================================= */

function providerIcon() {

    return `

        <svg viewBox="0 0 24 24">

            <path
                d="M2 8.5C7.5 3.5 16.5 3.5 22 8.5"
            />

            <path
                d="M5 12C9 8.5 15 8.5 19 12"
            />

            <path
                d="M8.5 15.5C10.5 13.8 13.5 13.8 15.5 15.5"
            />

            <circle
                cx="12"
                cy="19"
                r="1"
            />

        </svg>

    `;

}


/* =========================================================
   PROVIDER CATEGORY
========================================================= */

function providerCategory(provider) {

    const text =
        `${provider.name || ""} ${provider.description || ""}`
        .toLowerCase();


    if (
        text.includes("business")
    ) {

        return "business";

    }


    if (
        text.includes("install")
    ) {

        return "installation";

    }


    if (
        text.includes("public")
        ||
        text.includes("hour")
        ||
        text.includes("wifi")
    ) {

        return "wifi";

    }


    return "home";

}


/* =========================================================
   RENDER PROVIDERS
========================================================= */

function renderProviders() {

    const providerList =
        document.getElementById(
            "providerList"
        );


    if (!providerList) {

        return;

    }


    const searchInput =
        document.getElementById(
            "providerSearch"
        );


    const searchTerm =
        searchInput
            ?
            searchInput.value
                .trim()
                .toLowerCase()
            :
            "";


    let filtered =
        [...providers];


    if (
        activeProviderFilter !== "all"
    ) {

        filtered =
            filtered.filter(
                provider =>
                    providerCategory(
                        provider
                    )
                    ===
                    activeProviderFilter
            );

    }


    if (searchTerm) {

        filtered =
            filtered.filter(
                provider => {

                    const text = `

                        ${provider.name || ""}

                        ${provider.location || ""}

                        ${provider.price || ""}

                        ${provider.description || ""}

                    `.toLowerCase();


                    return text.includes(
                        searchTerm
                    );

                }
            );

    }


    const sortSelect =
        document.getElementById(
            "providerSort"
        );


    if (
        sortSelect
        &&
        sortSelect.value !== "default"
    ) {

        const sort =
            sortSelect.value;


        if (sort === "name") {

            filtered.sort(
                (a, b) =>
                    (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
            );

        }


        if (sort === "location") {

            filtered.sort(
                (a, b) =>
                    (a.location || "")
                    .localeCompare(
                        b.location || ""
                    )
            );

        }


        if (sort === "price") {

            filtered.sort(
                (a, b) => {

                    const priceA =
                        extractPrice(
                            a.price
                        );

                    const priceB =
                        extractPrice(
                            b.price
                        );

                    return priceA - priceB;

                }
            );

        }

    }


    if (filtered.length === 0) {

        providerList.innerHTML = `

            <div class="loading-card glass-card">

                <div class="glass-icon">

                    <svg viewBox="0 0 24 24">

                        <circle
                            cx="11"
                            cy="11"
                            r="7"
                        />

                        <path
                            d="M16 16L21 21"
                        />

                    </svg>

                </div>

                <p>
                    No providers found.
                </p>

            </div>

        `;

        return;

    }


    providerList.innerHTML =
        filtered
            .map(
                provider =>
                    providerCard(
                        provider
                    )
            )
            .join("");

}


/* =========================================================
   EXTRACT PRICE
========================================================= */

function extractPrice(value) {

    if (!value) {

        return 999999999;

    }


    const match =
        String(value)
            .replace(/,/g, "")
            .match(
                /[\d]+(?:\.[\d]+)?/
            );


    return match
        ?
        Number(match[0])
        :
        999999999;

}


/* =========================================================
   PROVIDER CARD
========================================================= */

function providerCard(provider) {

    const category =
        providerCategory(
            provider
        );


    return `

        <article
            class="provider-card glass-card"
        >

            <div class="provider-top">

                <div class="provider-icon">

                    ${providerIcon()}

                </div>

                <span class="provider-tag">

                    ${category}

                </span>

            </div>


            <h3>
                ${escapeHtml(
                    provider.name || "Provider"
                )}
            </h3>


            <div class="provider-location">

                <svg viewBox="0 0 24 24">

                    <path
                        d="M12 21C16 17 19 13.5 19 9C19 5.1 15.9 2 12 2C8.1 2 5 5.1 5 9C5 13.5 8 17 12 21Z"
                    />

                    <circle
                        cx="12"
                        cy="9"
                        r="2.5"
                    />

                </svg>

                ${escapeHtml(
                    provider.location || "Kenya"
                )}

            </div>


            <p class="provider-description">

                ${escapeHtml(
                    provider.description
                    ||
                    "Internet service provider."
                )}

            </p>


            <div class="provider-bottom">

                <div class="provider-price">

                    <span class="provider-price-label">
                        Starting / listed price
                    </span>

                    ${escapeHtml(
                        provider.price || "Contact provider"
                    )}

                </div>


                <button
                    class="provider-button"
                    type="button"
                    onclick="showProviderInfo(
                        ${Number(provider.id) || 0}
                    )"
                >
                    View details
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   PROVIDER DETAILS
========================================================= */

function showProviderInfo(id) {

    const provider =
        providers.find(
            item =>
                Number(item.id)
                ===
                Number(id)
        );


    if (!provider) {

        return;

    }


    alert(

        `${provider.name}\n\n` +

        `Location: ${provider.location}\n` +

        `Price: ${provider.price}\n\n` +

        `${provider.description || ""}`

    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   PROVIDER SEARCH
========================================================= */

const providerSearch =
    document.getElementById(
        "providerSearch"
    );


if (providerSearch) {

    providerSearch.addEventListener(
        "input",
        renderProviders
    );

}


/* =========================================================
   PROVIDER SORT
========================================================= */

const providerSort =
    document.getElementById(
        "providerSort"
    );


if (providerSort) {

    providerSort.addEventListener(
        "change",
        renderProviders
    );

}


/* =========================================================
   PROVIDER FILTER
========================================================= */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".filter"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                activeProviderFilter =
                    button.dataset.filter
                    ||
                    "all";


                renderProviders();

            }
        );

    });


/* =========================================================
   PACKAGE DATABASE
========================================================= */

const packages = [

    /* ---------------- SAFARICOM ---------------- */

    {
        provider: "Safaricom",
        name: "Bronze",
        speed: "40",
        unit: "Mbps",
        price: "KSh 2,999",
        period: "30 days",
        type: "fibre",
        category: "home",
        badge: "Popular"
    },

    {
        provider: "Safaricom",
        name: "Silver",
        speed: "60",
        unit: "Mbps",
        price: "KSh 4,100",
        period: "30 days",
        type: "fibre",
        category: "home",
        badge: "Home"
    },

    {
        provider: "Safaricom",
        name: "Gold",
        speed: "150",
        unit: "Mbps",
        price: "KSh 6,299",
        period: "30 days",
        type: "fibre",
        category: "home",
        badge: "Streaming"
    },

    {
        provider: "Safaricom",
        name: "Diamond",
        speed: "500",
        unit: "Mbps",
        price: "KSh 12,499",
        period: "30 days",
        type: "fibre",
        category: "home",
        badge: "Gaming"
    },

    {
        provider: "Safaricom",
        name: "Platinum",
        speed: "1",
        unit: "Gbps",
        price: "KSh 20,000",
        period: "30 days",
        type: "fibre",
        category: "home",
        badge: "1 Gbps"
    },

    {
        provider: "Safaricom",
        name: "Home 4G",
        speed: "3",
        unit: "Mbps",
        price: "KSh 3,699",
        period: "30 days",
        type: "wireless",
        category: "home",
        badge: "4G"
    },

    {
        provider: "Safaricom",
        name: "Home 4G Plus",
        speed: "5",
        unit: "Mbps",
        price: "KSh 5,299",
        period: "30 days",
        type: "wireless",
        category: "home",
        badge: "4G"
    },

    {
        provider: "Safaricom",
        name: "5G Home",
        speed: "250",
        unit: "Mbps",
        price: "KSh 7,500",
        period: "30 days",
        type: "5g",
        category: "home",
        badge: "5G"
    },


    /* ---------------- ZUKU ---------------- */

    {
        provider: "Zuku",
        name: "Shujaa",
        speed: "40",
        unit: "Mbps",
        price: "KSh 2,999",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Starter"
    },

    {
        provider: "Zuku",
        name: "Bingwa",
        speed: "80",
        unit: "Mbps",
        price: "KSh 3,999",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Popular"
    },

    {
        provider: "Zuku",
        name: "Stream",
        speed: "100",
        unit: "Mbps",
        price: "KSh 4,399",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Streaming"
    },

    {
        provider: "Zuku",
        name: "Connect",
        speed: "200",
        unit: "Mbps",
        price: "KSh 9,999",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "High Speed"
    },


    /* ---------------- FAIBA ---------------- */

    {
        provider: "Faiba Home Plus",
        name: "35 Mbps",
        speed: "35",
        unit: "Mbps",
        price: "KSh 3,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Starter"
    },

    {
        provider: "Faiba Home Plus",
        name: "60 Mbps",
        speed: "60",
        unit: "Mbps",
        price: "KSh 4,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Home"
    },

    {
        provider: "Faiba Home Plus",
        name: "90 Mbps",
        speed: "90",
        unit: "Mbps",
        price: "KSh 5,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Popular"
    },

    {
        provider: "Faiba Home Plus",
        name: "150 Mbps",
        speed: "150",
        unit: "Mbps",
        price: "KSh 10,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Streaming"
    },

    {
        provider: "Faiba Home Plus",
        name: "200 Mbps",
        speed: "200",
        unit: "Mbps",
        price: "KSh 15,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Power"
    },

    {
        provider: "Faiba Home Plus",
        name: "300 Mbps",
        speed: "300",
        unit: "Mbps",
        price: "KSh 20,000",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Business"
    },

    {
        provider: "Faiba Home Plus",
        name: "1 Gbps",
        speed: "1",
        unit: "Gbps",
        price: "KSh 30,000",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "1 Gbps"
    },


    /* ---------------- AIRTEL ---------------- */

    {
        provider: "Airtel",
        name: "5G Smart Connect 15",
        speed: "15",
        unit: "Mbps",
        price: "KSh 1,999",
        period: "30 days",
        type: "5g",
        category: "home",
        badge: "5G"
    },

    {
        provider: "Airtel",
        name: "5G Smart Connect 30",
        speed: "30",
        unit: "Mbps",
        price: "KSh 2,999",
        period: "30 days",
        type: "5g",
        category: "home",
        badge: "5G"
    },


    /* ---------------- MAWINGU ---------------- */

    {
        provider: "Mawingu",
        name: "Wireless 20",
        speed: "20",
        unit: "Mbps",
        price: "KSh 2,500",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Wireless"
    },

    {
        provider: "Mawingu",
        name: "Wireless 30",
        speed: "30",
        unit: "Mbps",
        price: "KSh 3,000",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Wireless"
    },

    {
        provider: "Mawingu",
        name: "Wireless 40",
        speed: "40",
        unit: "Mbps",
        price: "KSh 4,500",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "High Speed"
    },


    /* ---------------- INET AFRICA ---------------- */

    {
        provider: "iNet Africa",
        name: "20 Mbps",
        speed: "20",
        unit: "Mbps",
        price: "KSh 2,500",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Starter"
    },

    {
        provider: "iNet Africa",
        name: "40 Mbps",
        speed: "40",
        unit: "Mbps",
        price: "KSh 3,150",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Home"
    },

    {
        provider: "iNet Africa",
        name: "60 Mbps",
        speed: "60",
        unit: "Mbps",
        price: "KSh 3,650",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Home"
    },

    {
        provider: "iNet Africa",
        name: "80 Mbps",
        speed: "80",
        unit: "Mbps",
        price: "KSh 4,100",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Popular"
    },

    {
        provider: "iNet Africa",
        name: "100 Mbps",
        speed: "100",
        unit: "Mbps",
        price: "KSh 5,200",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Business"
    },

    {
        provider: "iNet Africa",
        name: "150 Mbps",
        speed: "150",
        unit: "Mbps",
        price: "KSh 6,250",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Power"
    },


    /* ---------------- STARLINK ---------------- */

    {
        provider: "Starlink",
        name: "Residential Lite",
        speed: "100+",
        unit: "Mbps",
        price: "Approx. KSh 4,000",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Satellite"
    },

    {
        provider: "Starlink",
        name: "Residential",
        speed: "200+",
        unit: "Mbps",
        price: "Approx. KSh 6,500",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Satellite"
    },


    /* ---------------- NETCONNECT LOCAL / SAMPLE ---------------- */

    {
        provider: "NetConnect Local",
        name: "Student Basic",
        speed: "5",
        unit: "Mbps",
        price: "KSh 500",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Student"
    },

    {
        provider: "NetConnect Local",
        name: "Student Plus",
        speed: "10",
        unit: "Mbps",
        price: "KSh 800",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Student"
    },

    {
        provider: "NetConnect Local",
        name: "Home Basic",
        speed: "15",
        unit: "Mbps",
        price: "KSh 1,000",
        period: "monthly",
        type: "wireless",
        category: "home",
        badge: "Budget"
    },

    {
        provider: "NetConnect Local",
        name: "Home Plus",
        speed: "25",
        unit: "Mbps",
        price: "KSh 1,500",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Home"
    },

    {
        provider: "NetConnect Local",
        name: "Home Pro",
        speed: "50",
        unit: "Mbps",
        price: "KSh 2,500",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Pro"
    },

    {
        provider: "NetConnect Local",
        name: "Gaming",
        speed: "100",
        unit: "Mbps",
        price: "KSh 4,000",
        period: "monthly",
        type: "fibre",
        category: "home",
        badge: "Gaming"
    },

    {
        provider: "NetConnect Local",
        name: "Business Basic",
        speed: "30",
        unit: "Mbps",
        price: "KSh 3,000",
        period: "monthly",
        type: "business",
        category: "business",
        badge: "Business"
    },

    {
        provider: "NetConnect Local",
        name: "Business Pro",
        speed: "100",
        unit: "Mbps",
        price: "KSh 7,500",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Business"
    },

    {
        provider: "NetConnect Local",
        name: "Business Max",
        speed: "250",
        unit: "Mbps",
        price: "KSh 12,000",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Business"
    },

    {
        provider: "NetConnect Local",
        name: "Office Ultra",
        speed: "500",
        unit: "Mbps",
        price: "KSh 18,000",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Business"
    },

    {
        provider: "NetConnect Local",
        name: "Enterprise",
        speed: "1",
        unit: "Gbps",
        price: "KSh 30,000",
        period: "monthly",
        type: "fibre",
        category: "business",
        badge: "Enterprise"
    }

];


/* =========================================================
   PACKAGE STATE
========================================================= */

let activePackageFilter =
    "all";


/* =========================================================
   PACKAGE RENDER
========================================================= */

function renderPackages() {

    const packageList =
        document.getElementById(
            "packageList"
        );


    const packageEmpty =
        document.getElementById(
            "packageEmpty"
        );


    const searchInput =
        document.getElementById(
            "packageSearch"
        );


    if (!packageList) {

        return;

    }


    const search =
        searchInput
            ?
            searchInput.value
                .trim()
                .toLowerCase()
            :
            "";


    let filtered =
        [...packages];


    if (
        activePackageFilter !== "all"
    ) {

        filtered =
            filtered.filter(
                item => {

                    return (

                        item.category
                        ===
                        activePackageFilter

                    )
                    ||
                    (

                        item.type
                        ===
                        activePackageFilter

                    );

                }
            );

    }


    if (search) {

        filtered =
            filtered.filter(
                item => {

                    const text = `

                        ${item.provider}

                        ${item.name}

                        ${item.speed}

                        ${item.unit}

                        ${item.price}

                        ${item.type}

                    `.toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (
        filtered.length === 0
    ) {

        packageList.innerHTML = "";

        packageEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    packageEmpty.classList.add(
        "hidden"
    );


    packageList.innerHTML =
        filtered
            .map(
                item =>
                    packageCard(item)
            )
            .join("");

}


/* =========================================================
   PACKAGE CARD
========================================================= */

function packageCard(item) {

    const featured =
        item.badge === "Popular"
        ||
        item.badge === "Gaming";


    return `

        <article
            class="
                package-card
                ${featured ? "featured" : ""}
            "
        >

            <div class="package-provider">

                <span
                    class="package-provider-name"
                >
                    ${escapeHtml(
                        item.provider
                    )}
                </span>

                <span
                    class="package-badge"
                >
                    ${escapeHtml(
                        item.badge
                    )}
                </span>

            </div>


            <h3>
                ${escapeHtml(
                    item.name
                )}
            </h3>


            <div class="package-speed">

                <strong>
                    ${escapeHtml(
                        item.speed
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        item.unit
                    )}
                </span>

            </div>


            <div class="package-price">

                <strong>
                    ${escapeHtml(
                        item.price
                    )}
                </strong>

                <span>
                    / ${escapeHtml(
                        item.period
                    )}
                </span>

            </div>


            <div class="package-meta">

                <span>
                    ${escapeHtml(
                        item.type
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        item.category
                    )}
                </span>

                <span>
                    Kenya
                </span>

            </div>


            <div class="package-action">

                <button
                    type="button"
                    onclick="showPackageInfo(
                        '${escapeHtml(
                            item.provider
                        )}',
                        '${escapeHtml(
                            item.name
                        )}',
                        '${escapeHtml(
                            item.speed
                        )} ${escapeHtml(
                            item.unit
                        )}',
                        '${escapeHtml(
                            item.price
                        )}'
                    )"
                >
                    View Package
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   PACKAGE INFORMATION
========================================================= */

function showPackageInfo(
    provider,
    name,
    speed,
    price
) {

    alert(

        `${provider}\n\n` +

        `${name}\n` +

        `Speed: ${speed}\n` +

        `Price: ${price}\n\n` +

        `Please confirm the current price and availability with the provider.`

    );

}


/* =========================================================
   PACKAGE SEARCH
========================================================= */

const packageSearch =
    document.getElementById(
        "packageSearch"
    );


if (packageSearch) {

    packageSearch.addEventListener(
        "input",
        renderPackages
    );

}


/* =========================================================
   PACKAGE FILTERS
========================================================= */

document
    .querySelectorAll(
        ".package-filter"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".package-filter"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                activePackageFilter =
                    button.dataset.packageFilter
                    ||
                    "all";


                renderPackages();

            }
        );

    });


/* =========================================================
   FAQ
========================================================= */

document
    .querySelectorAll(
        ".faq-question"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const item =
                    button.closest(
                        ".faq-item"
                    );


                const answer =
                    item.querySelector(
                        ".faq-answer"
                    );


                const isActive =
                    item.classList.contains(
                        "active"
                    );


                document
                    .querySelectorAll(
                        ".faq-item"
                    )
                    .forEach(
                        other => {

                            other.classList.remove(
                                "active"
                            );

                            const otherAnswer =
                                other.querySelector(
                                    ".faq-answer"
                                );


                            if (
                                otherAnswer
                            ) {

                                otherAnswer.style.maxHeight =
                                    null;

                            }

                        }
                    );


                if (!isActive) {

                    item.classList.add(
                        "active"
                    );


                    answer.style.maxHeight =
                        answer.scrollHeight
                        +
                        "px";

                }

            }
        );

    });


/* =========================================================
   CONTACT FORM
========================================================= */

const contactForm =
    document.getElementById(
        "contactForm"
    );


if (contactForm) {

    contactForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const status =
                document.getElementById(
                    "contactStatus"
                );


            if (status) {

                status.textContent =
                    "Message prepared successfully. Connect this form to your email/backend when ready.";

            }


            contactForm.reset();

        }
    );

}


/* =========================================================
   BACK TO TOP
========================================================= */

const backToTop =
    document.getElementById(
        "backToTop"
    );


window.addEventListener(
    "scroll",
    () => {

        if (!backToTop) {

            return;

        }


        if (window.scrollY > 500) {

            backToTop.classList.add(
                "visible"
            );

        }

        else {

            backToTop.classList.remove(
                "visible"
            );

        }

    }
);


if (backToTop) {

    backToTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================================
   MAIN SEARCH
========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


const searchButton =
    document.getElementById(
        "searchButton"
    );


function performMainSearch() {

    const value =
        searchInput
            ?
            searchInput.value
                .trim()
                .toLowerCase()
            :
            "";


    if (!value) {

        document
            .getElementById(
                "providers"
            )
            ?.scrollIntoView({
                behavior: "smooth"
            });

        return;

    }


    const providerMatch =
        providers.some(
            provider => {

                const text = `

                    ${provider.name || ""}

                    ${provider.location || ""}

                    ${provider.description || ""}

                `.toLowerCase();


                return text.includes(
                    value
                );

            }
        );


    const packageMatch =
        packages.some(
            item => {

                const text = `

                    ${item.provider}

                    ${item.name}

                    ${item.speed}

                    ${item.price}

                `.toLowerCase();


                return text.includes(
                    value
                );

            }
        );


    if (providerMatch) {

        const providerSearch =
            document.getElementById(
                "providerSearch"
            );


        if (providerSearch) {

            providerSearch.value =
                value;

            renderProviders();

        }


        document
            .getElementById(
                "providers"
            )
            ?.scrollIntoView({
                behavior: "smooth"
            });


        return;

    }


    if (packageMatch) {

        const packageSearch =
            document.getElementById(
                "packageSearch"
            );


        if (packageSearch) {

            packageSearch.value =
                value;

            renderPackages();

        }


        document
            .getElementById(
                "packages"
            )
            ?.scrollIntoView({
                behavior: "smooth"
            });


        return;

    }


    document
        .getElementById(
            "packages"
        )
        ?.scrollIntoView({
            behavior: "smooth"
        });


    const packageSearch =
        document.getElementById(
            "packageSearch"
        );


    if (packageSearch) {

        packageSearch.value =
            value;

        renderPackages();

    }

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        performMainSearch
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                performMainSearch();

            }

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

loadProviders();

renderPackages();

console.log(
    "NetConnect loaded successfully."
);

console.log(
    `${packages.length} packages available.`
);