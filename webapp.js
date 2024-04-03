      //import {oneSim, longRunSS} from './MonteCarloSim.js';
      const out = document.getElementById('test_output');
      //let chart;
      let res; // Monte Carlo result      

      // collect parameters in a single object
      const parms = {};
      parms.regular_deficit = document.getElementById("regular_deficit");
      parms.mean_growth = document.getElementById("mean_growth");
      parms.excess_time = document.getElementById("excess_time");
      parms.r_bar = document.getElementById("r_bar");
      parms.excess_deficit_mean = document.getElementById("excess_deficit_mean");
      parms.excess_amort = document.getElementById("excess_amort");
      parms.TT = document.getElementById("TT");
      parms.n_sim = document.getElementById("n_sim");

      function printParms() {
        for (const i in parms) {
          console.log(`${i}: ${parms[i].value}`)
        }
      }
      
      function updateLRSS() {
        //console.log("Hello from updateLRSS()!")
        let x_prob = 1/parms.excess_time.value;
        let lrss = longRunSS(parms.mean_growth.value, 
          parms.regular_deficit.value, 
          x_prob, 
          parms.excess_deficit_mean.value, 
          parms.excess_amort.value);
        out.innerHTML = `Long run steady state: ${lrss.toFixed(1)}%<br>`;
      }

      function updateSimulation() {
        //console.log("Hello from updateSimulation()!")
        let x_prob = 1/parms.excess_time.value;
        // compute MC sim
        res = MCsim(
          b0, parms.mean_growth.value, g_sd, g_se, parms.regular_deficit.value,
          x_prob, parms.excess_deficit_mean.value, x_sd, parms.excess_amort.value,
          i0, r0, parms.r_bar.value, LZ, tyr,
          parms.TT.value, parms.n_sim.value
        );
        // compute LRSS
        res.Schuldenquote.lrss = longRunSS(parms.mean_growth.value, 
          parms.regular_deficit.value, 
          x_prob, 
          parms.excess_deficit_mean.value, 
          parms.excess_amort.value);
        res.ZinsSteuerQuote.lrss = res.Schuldenquote.lrss*parms.r_bar.value/(tyr*(1+parms.mean_growth.value/100));
        
        renderChart(res);
      }

      function renderChart(dta) {

        // parse data in a format that is digestible by dygraph
        var TT = maxArray(dta.Schuldenquote.time);

        // Schuldenquoten-Daten
        var plotdat1 = Array(nobs+TT);
        // fill historical data
        for (let i=0; i<nobs; i++) {
          plotdat1[i] = [histdata.Jahr[i], 
                        [null, histdata.Schuldenquote[i], null], // historische Schuldenquote
                        [null, null, null], // Platzhalter für Median
                        [null, null, null] // Platzhalter für long run steady state
                       ]
        }
        // fill simulated future data        
        for (let i=0; i<TT; i++) {
          plotdat1[i+nobs] = [
            dta.Schuldenquote.time[i]+T0, 
            [null, null, null],
            [dta.Schuldenquote.p05[i], dta.Schuldenquote.median[i], dta.Schuldenquote.p95[i]],
            [null, dta.Schuldenquote.lrss, null]
          ]
        }
        // berechne bounds der Grafiken
        var bt_min = Math.min(
          Math.min(...histdata.Schuldenquote),
          Math.min(...dta.Schuldenquote.p05)
        );
        bt_min = 5*Math.floor(bt_min/5); // round to lower multiple of 5
        var bt_max = Math.max(
          Math.max(...histdata.Schuldenquote),
          Math.max(...dta.Schuldenquote.p95)
        );
        bt_max = 5*Math.ceil(bt_max/5);
        
        var plotdat2 = Array(nobs+TT);
        // fill historical data
        for (let i=0; i<nobs; i++) {
          plotdat2[i] = [
            histdata.Jahr[i], 
            [null, histdata.ZinsSteuerQuote[i], null],
            [null, null, null], // Platzhalter für Median
            [null, null, null] // Platzhalter für long run steady state
          ]
        }
        for (let i=0; i<TT; i++) {
          plotdat2[i+nobs] = [
            dta.ZinsSteuerQuote.time[i]+T0, 
            [null, null, null],
            [dta.ZinsSteuerQuote.p05[i], dta.ZinsSteuerQuote.median[i], dta.ZinsSteuerQuote.p95[i]],
            [null, dta.ZinsSteuerQuote.lrss, null]
          ]
        }
        // berechne bounds der Grafiken
        var zsq_max = Math.max(
          Math.max(...histdata.ZinsSteuerQuote),
          Math.max(...dta.ZinsSteuerQuote.p95)
        );
        zsq_max = 5*Math.ceil(zsq_max/5);
        
        g1 = new Dygraph(
          
          // containing div
          document.getElementById("graphdiv1"),
          
          // native array format
          plotdat1,
          
          // options
          {
            labels: [ "Zeit", "historisch", "Median", "langfr. Gleichgewicht"],
            labelsDiv: "graphlabel1",
            hideOverlayOnMouseOut: true,
            legend: "always",
            customBars: true,
            interactionModel: {}, // prevent zoom an pan
            series: {
              'historisch': {
                strokeWidth: 1.5,
                drawPoints: false,
                color: "rgb(0,128,0)",
              },
              'Median': {
                strokeWidth: 1.5,
                strokePattern: [2,5],
                drawPoints: false,
                color: "rgb(0,128,0)",
              },
              'langfr. Gleichgewicht': {
                strokeWidth: 1.0,
                strokePattern: [5,2],
                drawPoints: false,
                color: "rgb(0,128,0)",
              }
            },
            axes: {
              x: {
                drawAxis: true,
                drawGrid: false,
                valueFormatter: function(y) {return y.toFixed(0)},
                axisLabelFormatter: function(y) {return y.toFixed(0)},
              },
              y: {
                drawGrid: true,
                valueRange: [0, bt_max],
                valueFormatter: function(y) {return y.toFixed(1)},
                axisLabelFormatter: function(y) {return y.toFixed(0)},
              }
            },
            //title: "Schuldenquote [% des BIP]",
            //titleHeight: 25,
          }
        );

        g2 = new Dygraph(
          
          // containing div
          document.getElementById("graphdiv2"),
          
          // native array format
          plotdat2,
          
          // options
          {
            labels: [ "Zeit", "historisch", "Median", "langfr. Gleichgewicht"],
            labelsDiv: "graphlabel2",
            //hideOverlayOnMouseOut: true,
            legend: "always",
            customBars: true,
            interactionModel: {}, // prevent zoom an pan
            series: {
              'historisch': {
                strokeWidth: 1.5,
                color: "rgb(0,0,128)",
              },
              'Median': {
                strokeWidth: 1.5,
                strokePattern: [2,5],
                color: "rgb(0,0,128)",
              },
              'langfr. Gleichgewicht': {
                strokeWidth: 1.0,
                strokePattern: [5,2],
                color: "rgb(0,0,128)",
              }
            },
            axes: {
              x: {
                drawAxis: true,
                drawGrid: false,
                valueFormatter: function(y) {return y.toFixed(0)},
                axisLabelFormatter: function(y) {return y.toFixed(0)},
              },
              y: {
                drawGrid: true,
                valueRange: [0,zsq_max],
                valueFormatter: function(y) {return y.toFixed(1)},
                axisLabelFormatter: function(y) {return y.toFixed(0)},
              }
            },
            //title: "Zins-Steuer-Quote",
            //titleHeight: 25,
          }
        );

        // synchronize the charts
        var sync = Dygraph.synchronize(g1, g2);
      }
