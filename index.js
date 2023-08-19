// Created by peakd.com/@hivetrending

var width = 800,
  height = 700;
var speed = 3000;

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function updateData(nodes) {
  var u = d3.select("svg#viz").selectAll("g").data(nodes);

  u.enter()
    .append("g")
    .attr("class", "node")
    .each(function (d) {
      d3.select(this)
        .append("circle")
        .attr("class", function (d) {
          return d.color;
        })
        .attr("r", function (d) {
          return d.radius;
        });

      d3.select(this)
        .append("text")
        .attr("dominant-baseline", "central")
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.label;
        })
        .style("font-size", "17px");

      d3.select(this)
        .append("text")
        .attr("dy", "12px")
        .attr("dominant-baseline", "central")
        .attr("text-anchor", "middle")
        .text(function (d) {
          return `@${d.account.substr(0, 7)}...`;
        })
        .style("font-size", "10px")
        .attr("hidden", "true");
    });

  u.exit().remove();
}

function ticked() {
  var nodes = d3.select("svg#viz").selectAll("g");
  nodes.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

function createNodes(transactions) {
  var nodes = [];

  transactions.forEach((tx) => {
    tx.operations.forEach((op) => {
      var label = getLabel(op);
      var color = getNodeColor(label);
      var radius = clamp(label.length * 6.25, 30, 42);
      var account = getAccount(op);

      nodes.push({
        radius: radius,
        label: label,
        color: color,
        account: account,
      });
    });
  });
  return nodes;
}

function getLabel(operation) {
  var opname = operation[0];

  if (opname == "comment" || opname == "post") {
    var json = operation[1].json_metadata;
    if (json) {
      var json = JSON.parse(json);
    }

    if (json && json.app) {
      var app = json.app;

      if (typeof app === "string") {
        app = app.split("/")[0];
      } else if (app.name) {
        app = app.name;
      } else {
        app = "Unrecognized";
      }

      if (app == "leofinance" || app == "LeoFinance") {
        label = "Leo";
      } else if (app == "peakd") {
        label = "PeakD";
      } else if (app == "hiveblog") {
        label = "Hive.blog";
      } else if (app.includes("Poshtoken")) {
        label = "Posh";
      } else if (app == "3speak") {
        label = "3Speak";
      } else if (app == "leothreads") {
        label = "Leo";
      } else {
        label = app.substring(0, 9);
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      return label;
    } else {
      var label = opname;
      label = label.charAt(0).toUpperCase() + label.slice(1);
      return label;
    }
  } else if (opname == "custom_json") {
    var id = operation[1].id;

    var json = operation[1].json;
    var json = JSON.parse(json);

    if (id == "" && json.prevServerSeed) {
      return "EpicDice";
    }

    // Splinterlands related ops
    var app = json.app;

    if (typeof app === "object" && Object.keys(app).includes("name")) {
      app = app.name;
      if (app === "liketu") {
        return "LikeTu";
      }
    }

    if (
      (app &&
        typeof app === "string" &&
        (app.includes("steemmonsters") || app.includes("splinterlands"))) ||
      id.startsWith("sm_") ||
      id.startsWith("pm_") || 
      id.startsWith("sl-") || 
      id.startsWith("dev-sm_")
    ) {
      return "SL";
    }

    // Hive-Engine tokens
    if (id.startsWith("ssc-mainnet") && json.contractPayload) {
      if (json.contractPayload["symbol"] == "PIZZA") {
        return "PIZZA";
      } else if (
        ["WOO", "WOOALPHA", "WOOSATURN", "WOORAVEN"].includes(
          json.contractPayload["symbol"]
        )
      ) {
        return "WOO";
      } else if (
        ["BUDS", "BUDSX", "EXP"].includes(json.contractPayload["symbol"])
      ) {
        return "HashKings";
      } else if (json.contractPayload["symbol"] == "CROP") {
        return "dCrops";
      }
    }

    if (id.includes("cbm_")) {
      return "CBM";
    } else if (id.startsWith("ssc-mainnet") || id.startsWith("scot_")) {
      return "H-E";
    } else if (
      id == "pigs_expired/1" ||
      id == "reject_order/1" ||
      id == "game_request/1" ||
      id == "pack_purchase/1" ||
      id == "confirm_order/1" ||
      id == "fulfill_pigs/1" ||
      id == "end_game/1" ||
      id.startsWith("gmreq_") ||
      id == "start_game/1" ||
      id == "game_rewards/1" ||
      id == "pig_upgrade/1" ||
      id == "fulfill_points/1"
    ) {
      return "Piggies";
    } else if (id.startsWith("exode")) {
      return "Exode";
    } else if (id.startsWith("hb_")) {
      return "Holybread";
    } else if (id == "GameSeed") {
      return "KryptoG";
    } else if (id == "notify") {
      return "Notify";
    } else if (id == "follow") {
      return "Follow";
    } else if (id == "reblog") {
      return "Reblog";
    } else if (id.startsWith("dlux_")) {
      return "Dlux";
    } else if (id == "community") {
      return "Community";
    } else if (id.startsWith("esteem_")) {
      return "Ecency";
    } else if (id == "rabona") {
      return "Rabona";
    } else if (id == "sensorlog") {
      return "Kinoko";
    } else if (id == "actifit") {
      return "Actifit";
    } else if (id.startsWith("dcity")) {
      return "dCity";
    } else if (id.startsWith("lensy_")) {
      return "Lensy";
    } else if (id == "beacon_custom_json") {
      return "PeakD";
    } else if (id.startsWith("nftsr_")) {
      return "NFTSR";
    } else if (id.startsWith("dominuus_")) {
      return "Dominuus";
    } else if (id == "nextcolony") {
      return "NextColony";
    } else if (id == "drugwars" || id.startsWith("dw-")) {
      return "DrugWars";
    } else if (id == "leoinfra") {
      return "Leo";
    } else if (id.startsWith("qwoyn_")) {
      return "HashKings";
    } else if (id == "dope") {
      return "Dope";
    } else if (id == "commentcoin") {
      return "commentcoin";
    } else if (
      id.startsWith("pp_video") &&
      Object.keys(json).includes("generator") &&
      json.generator.includes("Hive-Tube")
    ) {
      return "HiveTube";
    } else if (id.startsWith("pp_")) {
      return "podping";
    } else if (id.startsWith("ssc-testnet-")) {
      return "H-E Testnet";
    } else if (id == "dcrops") {
      return "dCrops";
    } else if (id.startsWith("ecency_")) {
      return "Ecency";
    } else if (id.startsWith("spkcc_")) {
      return "SpkCC";
    } else if (id.startsWith("duat_")) {
      return "Ragnarok";
    } else if (id.startsWith("op_")) {
      return "OP";
    } else if (id.startsWith("woo_")) {
      return "WOO";
    } else if (id.includes("archmage_")) {
      return "Mage";
    } else if (id.startsWith("gls-")) {
      return "GLS";
    } else if (id.startsWith("sf_")) {
      return "Forge";
    } else if (id === "rc") {
      return "RC";
    } else if (id.startsWith("terracore_") || id.startsWith("tm_")) {
      return "Terracore";
    } else if (id.startsWith("peakd_")) {
      return "PeakD";
    } else if (id === "nftmart") {
      return "NFTMart";
    } else if (id.startsWith("mole-miner-")) {
      return "MuTerra";
    } else if (id.startsWith("go_")) {
      return "GolemO";
    } else if (id.startsWith("3speak-")) {
      return "3Speak";
    } else if (id.startsWith("leo_")) {
      return "Leo";
    } else if (id.startsWith("cc_")) {
      return "Crystal";
    } else {
      return "Other";
    }
  } else if (opname == "vote") {
    if (operation[1].weight > 0) {
      return "Up";
    } else {
      return "Downvote";
    }
  } else {
    // shorten the label
    label = operation[0].split("_")[0];
    // capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);
    label = label.substring(0, 9);
    return label;
  }
}

// Set node colors based on label strings

function getNodeColor(label) {
  if (label == "SL") {
    return "green";
  } else if (label == "Up" || label == "STEMSocia" || label == "Ecency") {
    return "blue";
  } else if (label == "Downvote" || label == "H-E" || label == "Actifit") {
    return "red";
  } else if (label === "HiveTube") {
    return "hotpink";
  } else if (label == "Other") {
    return "gray";
  } else if (
    label == "Post" ||
    label == "PeakD" ||
    label == "dCrops" ||
    label == "HashKings"
  ) {
    return "lightgreen";
  } else if (label == "Comment" || label == "Hive.blog") {
    return "yellow-orange";
  } else if (label == "Transfer" || label == "VIMM" || label == "Terracore") {
    return "orange";
  } else if (label == "CBM") {
    return "lightgreen";
  } else if (
    label == "PIZZA" ||
    label == "Leo" ||
    label == "Holybread" ||
    label == "podping" ||
    label == "WOO"
  ) {
    return "yellow";
  } else if (
    label == "Piggies" ||
    label == "3Speak" ||
    label == "SpkCC" ||
    label == "Ragnarok"
  ) {
    return "bluegreen";
  } else {
    return "gray";
  }
}

function getAccount(operation) {
  var opname = operation[0];

  if (opname == "vote") {
    var voter = operation[1].voter;
    return voter;
  } else if (opname == "custom_json") {
    var account = `${operation[1].required_posting_auths}`;
    return account;
  } else {
    return "account";
  }
}

// Start button controls

document.querySelector("button#gotoblock").onclick = (e) => {
  var blockNum = prompt(
    "Enter block number:",
    document.querySelector("#blockNum").innerText
  );

  // sanitize
  blockNum = parseInt(blockNum);

  if (!blockNum || blockNum < 0) {
    getLatestBlocknum();
  } else {
    document.querySelector("#blockNum").data = `${blockNum + 1}`;
    document.querySelector("#blockNum").innerText = `${blockNum}`;
  }
};

document.querySelector("button#pause").onclick = (e) => {
  document.querySelector("button#pause").hidden = true;
  document.querySelector("button#play").hidden = false;
};
document.querySelector("button#play").onclick = (e) => {
  document.querySelector("button#play").hidden = true;
  document.querySelector("button#pause").hidden = false;
};

document.querySelector("button#fastforward").onclick = (e) => {
  var minSpeed = 1.0;
  var maxSpeed = 3.0;
  var speedIncrement = 1.0;

  var currentSpeed = getSpeedSetting();
  if (currentSpeed == maxSpeed) {
    var newSpeed = minSpeed;
  } else {
    var newSpeed = currentSpeed + speedIncrement;
    newSpeed = clamp(newSpeed, minSpeed, maxSpeed);
  }

  // update UI
  document.querySelector("button#speedgauge").data = `${newSpeed}`;
  document.querySelector("button#speedgauge").innerText = `${newSpeed}x`;
};

function getSpeedSetting() {
  if (!document.querySelector("button#speedgauge").data) {
    document.querySelector("button#speedgauge").data = "1.0";
  }

  var currentSpeed = parseFloat(
    document.querySelector("button#speedgauge").data
  );
  return currentSpeed;
}

// End button controls

hive.api.setOptions({ url: "https://api.deathwing.me/" });

function getLatestBlocknum() {
  // Get the current blocknum
  hive.api.getDynamicGlobalProperties(function (err, result) {
    if (err) {
      console.log(err);
      return;
    }

    var currentWitness = result.current_witness;
    document.querySelector("#currentWitness").innerText = `${currentWitness}`;

    var blockNum = result.head_block_number;
    document.querySelector("#blockNum").innerText = `${blockNum}`;
    document.querySelector("#blockNum").data = `${blockNum}`;

    runLoop();
  });
}

function runLoop() {
  if (document.querySelector("button#pause").hidden == true) {
    return;
  }

  var blockNum = document.querySelector("#blockNum").data;
  if (!blockNum) {
    console.log("Failed to find block");
    return;
  }

  console.log(blockNum);

  hive.api.getBlock(blockNum, function (err, result) {
    //console.log(err, result);
    //console.log(blockNum)
    if (err) {
      console.log(err);
      return;
    }

    var block = result;
    // check if the block looks okay
    if (!block || !block.transactions) {
      return;
    }

    const blockSize = block.transactions.length;
    document.querySelector(
      "#blockSize"
    ).innerText = `${blockSize.toLocaleString()} transactions`;

    d3.select("svg#viz").selectAll("g").remove();
    var nodes = createNodes(block.transactions);
    updateData(nodes);

    var simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(0.1))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return d.radius * 1.0;
        })
      )
      .on("tick", ticked)
      .alpha(100);

    block.transactions.forEach((tx) => {
      tx.operations.forEach((op) => {
        if (op[0] === "custom_json") {
          if (getLabel(op) == "Other") {
            console.log("Unknown app");
            console.log(op);
          }
        }
      });
    });

    // if we succeeded so far, advance to next block
    if (document.querySelector("#blockNum").data == `${parseInt(blockNum)}`) {
      document.querySelector("#blockNum").data = `${parseInt(blockNum) + 1}`;
      document.querySelector("#blockNum").innerText = `${blockNum}`;
      document.querySelector("#currentWitness").innerText = `${block.witness}`;
      document.querySelector("#timestamp").innerText = `${block.timestamp}`;
    }
  });
}

// initialize, read params
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("block")) {
  var blockNum = urlParams.get("block");
  var blockNum = parseInt(blockNum);

  if (isNaN(blockNum) || blockNum < 0) {
    getLatestBlocknum();
  } else {
    document.querySelector("#blockNum").innerText = `${blockNum}`;
    document.querySelector("#blockNum").data = `${blockNum}`;
    runLoop();
  }
} else {
  getLatestBlocknum();
}

// repeat every N ms
function runtimeAdjustSpeed() {
  var currentSpeed = 3000 / getSpeedSetting();

  runLoop();

  setTimeout(() => {
    runtimeAdjustSpeed();
  }, currentSpeed);
}

runtimeAdjustSpeed();
