/* Std Library tools */
Number.prototype.padZero= function(len){
    var s= String(this), c= '0';
    len= len || 2;
    while(s.length < len) s= c + s;
    return s;
}

/* Startup */
$(function() {
    app = new tapsApp();
});

function tapsApp () {
    var data = new tapsDataStore();
    var chart = new tapsChart($('#chart'));
    var list = new tapsList($('#ctr-list'));
    var curCounter;
    
    /* Load defaults */
    if (data.getCounters().length == 0) {
        var id = data.addCounter()
        curCounter = id;
    } else {
        curCounter = data.getCounters()[0].id;
    }
    
    updateCtrSelect();
    changeCounter(curCounter);
    
    /* Event handlers */
    $('#cnt-in').click(function() {
        data.count(curCounter, 1);
        updateCounter();
    });
    $('#cnt-out').click(function() {
        data.count(curCounter, -1);
        updateCounter();
    });
    $('#cnt-revert').click(function() {
        data.revert(curCounter);
        updateCounter();
    });
    $('#cnt-start').click(function() {
        if (data.CtrIsActive(curCounter))
            data.pauseCtr(curCounter);
        else {
            if (data.getStart(curCounter) == 0)
                chart.update([],true,Math.floor(Date.now() / 1000));
            data.startCtr(curCounter);
        }
        updateCounterState();
    });
    $('#ctr-name').change(function() {
        data.setName(curCounter,$(this).val());
        updateCtrSelect();
    });
    $('.choose-counter').change(function() {
        changeCounter($(this).val());
    });
    $('#add-ctr').click(function() {
        var id = data.addCounter();
        updateCtrSelect();
        changeCounter(id);
    });
    $('#del-ctr').click(function() {
        if (data.getCounters().length > 1) {
            if ($(this).prop('rly')) {
                data.removeCounter(curCounter);
                updateCtrSelect();
                changeCounter(data.getCounters()[0].id);
                $('#del-ctr').prop('rly',false);
                $('#del-ctr').text('– Delete');
            } else {
                $(this).prop('rly',true);
                $(this).text('Sure?');
            }
        }
    });
    $('#del-ctr').blur(function() {
        $('#del-ctr').prop('rly',false);
        $('#del-ctr').text('– Delete');
    });
    $('#choose-view-data').change(function() {
        chart.init($(this).val(),parseInt($('#view-interval').val()));
        chart.update(data.getEntries(curCounter),true,data.getStart(curCounter));
    });
    $('#view-interval').keydown(function(e) {
        if (e.keyCode == 13) {
            chart.init($('#choose-view-data').val(),parseInt($(this).val()));
            chart.update(data.getEntries(curCounter),true,data.getStart(curCounter));
        }
    });
    $('#export').click(function() {
        dataExport($('#choose-view-data').val(),$('#choose-export-format').val(),parseInt($('#view-interval').val()));
    });
    $('input[type="text"]').keydown(function(e) {
        e.stopPropagation();
    });
    $('html').keydown(function(e) {
        switch(e.keyCode) {
            case 107: //NUM+
            case 32: //SPACE
                $('#cnt-in').addClass('active').delay(75)
                        .queue(function(){
                            $(this).removeClass('active').dequeue();
                        });
                data.count(curCounter, 1);
                updateCounter();
                break;
            case 109: //NUM-
            case 189: //-
                $('#cnt-out').addClass('active').delay(75)
                        .queue(function(){
                            $(this).removeClass('active').dequeue();
                        });
                data.count(curCounter, -1);
                updateCounter();
                break;
        }
    });
    
    /**
     * Update the options and selection of .choose-counter and disable state of  #del-ctr
     * Should be called after changes to counters
     */
    function updateCtrSelect () {
        var ctrs = data.getCounters();
        $('.choose-counter').children().detach();
        for (var i in ctrs) {
            $('.choose-counter').append($("<option></option>")
                .attr("value",ctrs[i].id)
                .text(ctrs[i].name));
        }
        $('.choose-counter').val(curCounter);
        
        $('#del-ctr').prop('disabled', (data.getCounters().length < 2));
    }
    /**
     * Update the displayed counter value and disable of revert button
     * Should be called after each count/revert.
     */
    function updateCounter() {
        $('#counter').text(data.getCounter(curCounter));
        $('#cnt-revert').prop("disabled", (data.getEntries(curCounter).length == 0));
        chart.update(data.getEntries(curCounter),false,data.getStart(curCounter));
        list.update(data.getEntries(curCounter),false);
    }
    /**
     * Update disable state of count buttons and caption of start/pause button
     * Should be called after each (in)activation of counter
     */
    function updateCounterState() {
        $('#cnt-out').prop("disabled", (!data.CtrIsActive(curCounter)));
        $('#cnt-in').prop("disabled", (!data.CtrIsActive(curCounter)));
        $('#cnt-revert').prop("disabled", (!data.CtrIsActive(curCounter)));
        $('#cnt-start').text(data.CtrIsActive(curCounter) ? '‖' : '►');
    }
    /**
     * Update everything when changing a counter.
     */
    function changeCounter(id) {
        curCounter = id;
        $('.choose-counter').val(id);
        $('#ctr-name').val(data.getName(id));
        chart.update(data.getEntries(id),true,data.getStart(id));
        list.update(data.getEntries(id),true);
        updateCounter();
        updateCounterState();
    }
    
    function dataExport(type, format, interval) {
        var mime = (format == 0 ) ? 'application/json' : 'text/csv';
        var filename = "taps-" + data.getName(curCounter) + (format == 0 ? '.json' : '.csv');
        var output = "";
        
        if (type == 0) {
            if (format == 0) {
                output = JSON.stringify({
                    "start": data.getStart(curCounter),
                    "pause": data.getPause(curCounter),
                    "pausedTime": data.getPausedTime(curCounter),
                    "name": data.getName(curCounter),
                    "data": data.getEntries(curCounter)
                });
            } else if (format == 1) {
                var entr = data.getEntries(curCounter);
                for (var i in entr) {
                    output += tapsUtil.formatDateToExcel(entr[i].t) + ";" + entr[i].d + "\n"; //TODO format timestamp
                }
            }
        } else if (type == 1) {
            var groups = tapsUtil.aggregate(data.getEntries(curCounter),data.getStart(curCounter),interval);
            
            if (format == 0) {
                output = JSON.stringify({
                    "start": data.getStart(curCounter),
                    "pause": data.getPause(curCounter),
                    "pausedTime": data.getPausedTime(curCounter),
                    "name": data.getName(curCounter),
                    "groups": groups
                });
            } else if (format == 1) {
                for (var i in groups) {
                    output += tapsUtil.formatDateToExcel(groups[i].t) + ";" + groups[i].p + ";" + groups[i].n + "\n"; //TODO format timestamp
                }
            }
        }
        
        var a = window.document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([output], {type: mime}));
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
    }
    
}

function tapsDataStore() {
    /* Init data and load from local storage if exists */
    var data = {"ctr" : []};
    if(localStorage.getItem('taps.data'))
        data = JSON.parse(localStorage.getItem('taps.data'));
    
    /* Register onBeforeUnload handler to store data */
    var tDS = this;
    window.onbeforeunload = function () {
        tDS.saveData();
    }
    
    this.saveData = function () {
        localStorage.setItem('taps.data', JSON.stringify(data));
    };
    
    /* Add and remove counters */
    this.addCounter = function() {
        var newId = data.ctr.length;
        data.ctr.push({
            "name" : "Counter " + newId,
            "start" : 0,
            "pause" : 0,
            "pausedTime" : 0,
            "data" : [],
            "counter" : 0
        });
        return newId;
    };
    this.removeCounter = function (id) {
        data.ctr.splice(id,1);
    };
    this.getCounters = function () {
        var ret = [];
        for (var i in data.ctr) {
            ret[i] = {"id": i, "name": data.ctr[i].name};
        }
        return ret;
    };
    this.CtrExists = function (id) {
        return (typeof data.ctr[id] != "undefined" && data.ctr[id] !== "null");
    };
    
    /* Get counter properties */
    this.getStart = function (id) {
        if (!this.CtrExists(id))
            return null;

        return data.ctr[id].start;
    }
    this.getPause = function (id) {
        if (!this.CtrExists(id))
            return null;

        return data.ctr[id].pause;
    }
    this.getPausedTime = function (id) {
        if (!this.CtrExists(id))
            return null;

        return data.ctr[id].pausedTime;
    }
    this.getName = function (id) {
        if (!this.CtrExists(id))
            return null;
        
        return data.ctr[id].name;
    }
    this.CtrIsActive = function (id) {
        if (!this.CtrExists(id))
            return null;

        return (this.getStart(id) != 0 && this.getPause(id) == 0);
    };
    this.getEntries = function(id) {
        if (!this.CtrExists(id))
            return;
        
        return data.ctr[id].data;
    };
    this.getCounter = function (id) {
        if (!this.CtrExists(id))
            return null;

        return data.ctr[id].counter;
    };
    
    /* Set counter properties and count */
    this.setName = function (id, name) {
        if (!this.CtrExists(id))
            return;
        
        data.ctr[id].name = name;
    };
    this.startCtr = function (id) {
        if (!this.CtrExists(id))
            return;

        if (this.getStart(id) == 0) {
            data.ctr[id].start = Math.floor(Date.now() / 1000);
        } else if (this.getPause(id) != 0) {
            data.ctr[id].pausedTime += (Math.floor(Date.now() / 1000) - this.getPause(id));
            data.ctr[id].pause = 0;
        }
    };
    this.pauseCtr = function (id) {
        if (!this.CtrExists(id))
            return;
        if (this.CtrIsActive(id))
            data.ctr[id].pause = Math.floor(Date.now() / 1000);
    };
    this.count = function (id, dir) {
        if (this.CtrExists(id) && this.CtrIsActive(id)) {
            var sgn = Math.sign(dir);
            if (sgn == 0)
                return;
            
            data.ctr[id].data.push({"t": Math.floor(Date.now() / 1000), "d": sgn});
            data.ctr[id].counter += sgn;
        }
    };
    this.revert = function (id) {
        if (this.CtrExists(id) && data.ctr[id].data.length > 0) {
            var tmp = data.ctr[id].data.pop();
            data.ctr[id].counter -= tmp.d;
        }
    };
}



function tapsChart (container) {
    var cdata = {"data":[],"axisX":{},backgroundColor: "#000000"};
    var chart = new CanvasJS.Chart(container[0],cdata);
    var type = 0;
    var interval = 300;
    
    this.init = function (newtype, newinterval) {
        type = newtype;
        interval = newinterval;
    };
    this.update = function (data, fullupdate, start) {
        if (cdata.data.length == 0 || start == 0)
            fullupdate = true;
        
        if (type == 0) {            
            if (fullupdate) {
                cdata.data = [{"type": "stepLine", "dataPoints": []}];
                if (start != 0)
                    cdata.data[0].dataPoints.push({x:new Date(start*1000),y:0});
                
                var cnt = 0;
                for (var i = 0;i<data.length;i++) {
                    cnt += data[i].d;
                    cdata.data[0].dataPoints.push({x: new Date(data[i].t*1000), y: cnt});
                }
            } else {
                if (cdata.data[0].dataPoints.length-1 < data.length) {
                    
                    if (cdata.data[0].dataPoints.length == 0) {
                        if (start != 0)
                            cdata.data[0].dataPoints.push({x:new Date(start*1000),y:0});
                        cnt = 0;
                    } else {
                        cnt = cdata.data[0].dataPoints.slice(-1)[0].y;
                    }
                    cnt += data.slice(-1)[0].d;
                    cdata.data[0].dataPoints.push({x: new Date(data.slice(-1)[0].t*1000), y: cnt});
                } else if (cdata.data[0].dataPoints.length-1 > data.length) {
                    cdata.data[0].dataPoints.splice(-1,1);
                }
            }
            
        } else if (type == 1) {
            
            // TODO: if (!fullupdate) schlauer
            
                cdata.data = [
                    {"type": "stackedColumn", "dataPoints": []},
                    {"type": "stackedColumn", "dataPoints": []}
                ];
                
                if (data.length > 0) {
                    var groups = tapsUtil.aggregate(data,start,interval);
                    for (var i in groups) {
                        cdata.data[0].dataPoints.push({x: new Date(groups[i].t*1000), y: groups[i].p});
                        cdata.data[1].dataPoints.push({x: new Date(groups[i].t*1000), y: -groups[i].n});
                    }
                }
        }
        chart.render();
    };
}

tapsList = function(container) {
    var len = 0;
    /* difference in seconds to start new paragraph */
    var diff = 2	;
    
    this.update = function(data,fullupdate) {
        if (fullupdate) {
            container.children().detach();
            
            if (data.length > 0) {
                var p = $('<p></p>');
                for (var i in data) {
                    if (i != 0 && data[i-1].t <= data[i].t-diff) {
                        container.prepend(p);
                        p = $('<p></p>');
                    }
                    p.prepend((data[i].d > 0) ? '+' : '–');
                    len++;
                }
                container.prepend(p)
            }
        } else {
            if (len < data.length) {
                if (data.length == 1 || data[data.length-2].t <= data[data.length-1].t - diff) {
                    var p = $('<p></p>').prepend((data[data.length-1].d > 0) ? '+' : '–');
                    container.prepend(p);
                } else {
                    container.children().first().prepend((data[data.length-1].d > 0) ? '+' : '–');
                }
                len++;
            } else if (len > data.length) {
                var firstp = container.children().first();
                firstp.text(firstp.text().slice(1));
                if (firstp.text() == '')
                    firstp.detach();
                len--;
            }
        }
    }
};

tapsUtil = {
    aggregate: function (data,start,interval) {
        var groups = [];
        var index = 0;
        
        var end = data[data.length-1].t;
        
        while(index < data.length && data[index].t < start)
            index++;
        
        for (var t = start; t < end+interval; t += interval) {
            var valp = 0;
            var valn = 0;
            while(index < data.length && data[index].t < t + interval) {
                if (data[index].d > 0)
                    valp++;
                else if (data[index].d < 0)
                    valn++;
                
                index++;
            }
            groups.push({"t": t+interval/2, "p": valp, "n": valn});
        }
        
        return groups;        
    },
    
    formatDateToExcel: function (ts) {
        var d = new Date(ts * 1000);
        return (d.getFullYear() + "-" + d.getMonth().padZero(2) + "-" + d.getDate().padZero(2) + " "
                + d.getHours().padZero(2) + ":" + d.getMinutes().padZero(2) + ":" + d.getSeconds().padZero(2));
    }

};
