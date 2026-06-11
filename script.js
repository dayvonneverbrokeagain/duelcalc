let rates = {};
let updating = false;

const inputs = {
    USD: document.getElementById("usd"),
    PLN: document.getElementById("pln"),
    ARS: document.getElementById("ars"),
    SOL: document.getElementById("sol")
};

async function loadRates() {
    try {
        const forexResponse = await fetch("https://open.er-api.com/v6/latest/USD");
        const forexData = await forexResponse.json();

        const solResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const solData = await solResponse.json();

        rates = {
            USD: 1,
            PLN: forexData.rates.PLN,
            ARS: forexData.rates.ARS,
            SOL: solData.solana.usd
        };

        document.getElementById("rateInfo").textContent =
            `1 USD = ${rates.PLN.toFixed(4)} PLN | ` +
            `1 USD = ${Math.round(rates.ARS)} ARS | ` +
            `1 SOL = ${rates.SOL.toFixed(2)} USD`;

    } catch (error) {
        document.getElementById("rateInfo").textContent = "Błąd pobierania kursów";
        console.error(error);
    }
}

function formatValue(currency, value) {
    if (!isFinite(value)) return "";

    if (currency === "SOL") {
        return value.toFixed(5);
    }

    return value.toFixed(2);
}

function convert(fromCurrency, amount) {
    if (updating) return;

    if (isNaN(amount)) {
        updating = true;
        Object.values(inputs).forEach(input => input.value = "");
        updating = false;
        return;
    }

    updating = true;

    let usdValue;

    if (fromCurrency === "SOL") {
        usdValue = amount * rates.SOL;
    } else if (fromCurrency === "USD") {
        usdValue = amount;
    } else {
        usdValue = amount / rates[fromCurrency];
    }

    const values = {
        USD: usdValue,
        PLN: usdValue * rates.PLN,
        ARS: usdValue * rates.ARS,
        SOL: usdValue / rates.SOL
    };

    Object.keys(inputs).forEach(currency => {
        if (currency !== fromCurrency) {
            inputs[currency].value = formatValue(currency, values[currency]);
        }
    });

    updating = false;
}

function limitDecimals(event, maxDecimals) {
    let value = event.target.value;

    value = value.replace(",", ".");

    const firstDot = value.indexOf(".");

    if (firstDot !== -1) {
        value =
            value.substring(0, firstDot + 1) +
            value.substring(firstDot + 1).replace(/\./g, "");
    }

    if (value.includes(".")) {
        const parts = value.split(".");

        if (parts[1].length > maxDecimals) {
            value = parts[0] + "." + parts[1].slice(0, maxDecimals);
        }
    }

    event.target.value = value;
}

function handleInput(currency, maxDecimals, event) {
    limitDecimals(event, maxDecimals);
    convert(currency, parseFloat(event.target.value));
}

function formatField(input) {
    const value = parseFloat(input.value);

    if (isNaN(value)) {
        input.value = "";
        return;
    }

    const currency = input.id.toUpperCase();
    input.value = formatValue(currency, value);
}

inputs.USD.addEventListener("input", e => handleInput("USD", 2, e));
inputs.PLN.addEventListener("input", e => handleInput("PLN", 2, e));
inputs.ARS.addEventListener("input", e => handleInput("ARS", 2, e));
inputs.SOL.addEventListener("input", e => handleInput("SOL", 5, e));

Object.values(inputs).forEach(input => {
    input.addEventListener("blur", e => formatField(e.target));
});

loadRates();
setInterval(loadRates, 300000);