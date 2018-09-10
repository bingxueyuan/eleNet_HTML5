const windowsLimit = function () {
    window.onresize = function ()
    {
        if (document.body.scrollWidth < Default.window.limit)
        {
            console.warn('屏幕宽度' + document.body.clientWidth)
        }
    }
};

//-------------------- equipment.html
/**
 * Chart绘图
 * @param url
 * @param current_sensor
 */
const drawChart = function (url = 'http://php.io/equipment', current_sensor = 'ph')
{
    let chart = $('#chart');
    let loading = $('#loading');
    let error = $('#error');
    let page_button = $('#page_button');
    let page_table = $('#page_table');

    let all_rows = $('#all_rows');
    let current_pages = $('#current_pages');
    let all_pages = $('#all_pages');

    chart.hide();
    loading.show();
    error.hide();
    page_button.hide();
    page_table.hide();

    let fetchDraw = function (url, currentPage, current_sensor) {
        $.ajax({
            url: url,
            type: 'POST',
            data: {default: 1, var: current_sensor, current_pages: currentPage},
            dataType: 'json',
            error: function () {
                chart.hide();
                loading.hide();
                error.show();
            },
            success: function (data) {

                chart.show();
                loading.hide();
                error.hide();

                page_button.show();
                page_table.show();

                let myChart = echarts.init(document.getElementById('chart'));
                let date = new Date();
                let option = {
                    title: {
                        text: data['data'][0][0]['sensor_name'] + '\40' + '绘图',
                        subtext: date.getFullYear() + '/' + ( date.getMonth() + 1 ) + '/' + date.getDate() + '\40' +
                        date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds(),
                        x: 'center'
                    },
                    toolbox: {
                        right: 2,
                        feature: {
                            dataZoom: {
                                yAxisIndex: 'none'
                            },
                            magicType: {type: ['line', 'bar']},
                            restore: {},
                            saveAsImage: {
                                type: 'jpeg',
                                name: data['message'],
                                pixelRatio: 2,
                                excludeComponents: [],
                                title: '保存'
                            }
                        }
                    },
                    dataZoom: [{
                    }, {
                        type: 'inside',
                    }],
                    xAxis: {
                        type: 'category',
                        data: data['data'][0][0]['current_key'],
                        splitLine:{show: false},
                        splitArea : {show : false}
                    },
                    yAxis: {
                        type: 'value',
                        splitLine:{show: false},
                        splitArea : {show : false}
                    },
                    series: [{
                        data: data['data'][0][0]['current_value'],
                        type: 'line',
                        markLine: {
                            silent: true,
                            data: [
                                {
                                    yAxis: data['data'][0][0]['line']
                                },
                            ],
                        },
                        color: '#FF5722'
                    }],
                    visualMap: {
                        orient: 'horizontal',
                        top: 10,
                        left: 0,
                        pieces: [{
                            gt: data['data'][0][0]['pieces']['normal']['gt'],
                            lte: data['data'][0][0]['pieces']['normal']['lt'],
                            color: '#009688'
                        }, {
                            gt: data['data'][0][0]['pieces']['min']['gt'],
                            lte: data['data'][0][0]['pieces']['min']['lt'],
                            color: '#FFB800'
                        }, {
                            gt: data['data'][0][0]['pieces']['max']['gt'],
                            lte: data['data'][0][0]['pieces']['max']['lt'],
                            color: '#FF5722'
                        }],
                        outOfRange: {
                            color: '#2F4056'
                        }
                    },
                };
                myChart.setOption(option);

                layui.laypage.render({
                    elem: 'page_button',
                    count: data['data'][0][0]['all_rows'],
                    limit: data['data'][0][0]['limit'],
                    jump: function(obj, first){
                        if(!first){
                            chart.hide();
                            page_button.hide();
                            page_table.hide();
                            loading.show();
                            fetchDraw(url = 'http://php.io/equipment', obj.curr, $('#can').attr('data-id'));
                        }
                    },
                    curr: data['data'][0][0]['current_pages'],
                });


                all_rows.text(data['data'][0][0]['all_rows']);
                current_pages.text(data['data'][0][0]['current_pages']);
                all_pages.text(data['data'][0][0]['all_pages']);
            },
        })
    };

    fetchDraw(url, 1, current_sensor)
};

/**
 * 渲染设备列表
 */
const renderEquipmentTab = function (url = 'http://php.io/equipment') {

    let sensor = document.getElementById('sensor');

    let template = doT.template
    (
        '{{~ it :value :key }}<li id="{{= value.sensor_id }}" class="sensor_item">{{= value.sensor_name }}</li>{{~ }}'
    );

    $.ajax({
        url: url,
        type: 'POST',
        data: {equipmentList: 1},
        dataType: 'json',
        error: function () {
        },
        success: function (data) {
            sensor.innerHTML = template(data['data'][0][0]);
        }
    });
};

/**
 * 点击设备栏
 */
const clickEquipmentTab = function () {
    $('ul').on('click', '.sensor_item', function () {
        $('#can').attr('data-id', this.id);
        drawChart('http://php.io/equipment', this.id);
    })

};
//-------------------- /equipment.html

//-------------------- process.html
/**
 * 进程
 */
const processPageList = function () {
    let tbody = $('tbody');
    let table = $('table');
    let add_process = $('#add_process');
    let refresh = $('#refresh');
    let search_script_btn = $('#search_script_btn');
    let search_script_input = $('#search_script_input');
    let checkCount = $('.checkCount');
    let error = $('#error');
    let loading = $('#loading');
    let page_button = $('#page_button');

    error.hide();
    table.hide();
    page_button.hide();

    let processList = document.getElementById('process-list');

    let template = doT.template
    (
        '{{~ it :value :key }}' +
        '<tr>' +
        '<td><span>{{= value.pid }}</span></td>' +
        '' +
        '<td>' +
        '<div class="text-center">' +
        '{{? value.state === \'1\' }}' +
        '<i class="fa fa-circle text-default"></i>' +
        '{{?? }}' +
        '<i class="fa fa-circle text-red"></i>' +
        '{{?}}' +
        '</div>' +
        '</td>' +
        '' +
        '<td><span>{{= value.script }}</span></td>' +
        '' +
        '<td><span>{{= value.process_explain }}</span></td>' +
        '' +
        '<td><span >{{= value.date }}</span></td>' +
        '' +
        '<td>' +
        '<span class="guard_pid">' +
        '<input type="checkbox" title="守护">' +
        '</span>' +
        '</td>' +
        '<td>' +
        '<div class="text-center">' +
        '<div class="layui-btn-group">' +
        '<button class="pid_exist layui-btn layui-btn-primary layui-btn-sm">' +
        '<i class="fa fa-send-o"></i>' +
        '</button>' +
        '<button class="pid_start layui-btn layui-btn-primary layui-btn-sm">' +
        '<i class="fa fa-play"></i>' +
        '</button>' +
        '<button class="pid_remove layui-btn layui-btn-primary layui-btn-sm">' +
        '<i class="fa fa-remove"></i>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '' +
        '</tr>' +
        '{{~ }}'
    );

    let renderList = function(currentPage = 1, script = null, url = 'http://php.io/process'){
        $.ajax({
            url: url,
            type: 'POST',
            data: {token: 123456, getProcess: 1, currentPage: currentPage, script: script},
            dataType: 'json',
            error: function () {
                error.show();
                table.hide();
                loading.hide();
                page_button.hide();

            },
            success: function (data) {
                error.hide();
                loading.hide();
                table.show();
                page_button.show();

                /**
                 * 拼接列表
                 */
                processList.innerHTML = template(data['data'][0]['process']);
                layui.form.render();

                layui.laypage.render({
                    elem: 'page_button',
                    count: data['data'][0]['all_rows'],
                    limit: data['data'][0]['limit'],
                    jump: function(obj, first){
                        if(!first){
                            error.hide();
                            table.hide();
                            page_button.hide();
                            loading.show();
                            renderList(obj.curr, null);
                        }
                    },
                    curr: data['data'][0]['current_pages'],
                });
            }
        });
    };

    renderList(1, null);
    /**
     * 多选框
     */
    tbody.on('click', '.layui-form-checkbox', function () {
        // 点击选取一个复选框
        if ($(this).attr('class') === 'layui-unselect layui-form-checkbox layui-form-checked'){
            // 标记已选择
            $(this).prev().attr('checked','checked');
        }else {
            // 取消已选择
            $(this).prev().removeAttr('checked')
        }

        // 显示选中多少条
        $(checkCount).text($(tbody).find('[class=\'p-1\']').find('[checked=\'checked\']').length);
    });

    /**
     * 守护按钮
     */
    tbody.on('click', '.guard_pid', function () {
        /**
         * 选择
         */
        if ($(this).find('div.layui-unselect').attr('class') === 'layui-unselect layui-form-checkbox layui-form-checked')
        {
            console.log('已守护');

            setInterval(function () {
                $.ajax({
                    url: 'http://php.io/process',
                    type: 'POST',
                    data: {
                        token: 123456,
                        startProcess: 1,
                        script: $(this).parent().parent().parent().siblings('td:eq(2)').text()
                    },
                    dataType: 'json',
                    error: function () {
                    },
                    success: function () {
                        location.reload()
                    }
                });
            }, 60 * 1000)
        }
        /**
         * 取消
         */
        else
        {
            setInterval(function () {
                console.log('已取消守护')
            }, 60 * 1000)
        }
    });

    /**
     * 检测PID是否存在
     */
    tbody.on('click', '.pid_exist', function () {

        $.ajax({
            url: 'http://php.io/process',
            type: 'POST',
            data: {
                token: 123456,
                ping: 1,
                pid: $(this).parent().parent().parent().siblings('td:eq(0)').text()
            },
            dataType: 'json',
            error: function () {
            },
            success: function (data) {
                layer.msg(data['message']);
                setTimeout(function () {
                    location.reload()
                }, 3000);
            }
        });

    });
    /**
     * 启动进程
     */
    tbody.on('click', '.pid_start', function () {

        $.ajax({
            url: 'http://php.io/process',
            type: 'POST',
            data: {
                token: 123456,
                startProcess: 1,
                script: $(this).parent().parent().parent().siblings('td:eq(2)').text()
            },
            dataType: 'json',
            error: function () {
            },
            success: function (data) {
                layer.msg(data['message']);
            }
        });

        setTimeout(function () {
            location.reload()
        }, 3000);

    });

    /**
     * 移除进程
     */
    tbody.on('click', '.pid_remove', function () {

        $.ajax({
            url: 'http://php.io/process',
            type: 'POST',
            data: {
                token: 123456,
                removeProcess: 1,
                script: $(this).parent().parent().parent().siblings('td:eq(2)').text()
            },
            dataType: 'json',
            error: function () {
            },
            success: function (data) {
                layer.msg(data['message']);
                setTimeout(function () {
                    location.reload()
                }, 3000);
            }
        });

    });

    /**
     * 搜索
     */
    search_script_btn.click(function () {
        error.hide();
        table.hide();
        page_button.hide();
        loading.show();
        renderList(1, search_script_input.val());
    });

    /**
     * 添加进程
     */
    add_process.click(function () {
        layer.open({
            type: 1,
            title: '<i class="fa fa-recycle fa-lg mr-2"></i>添加进程',
            shade: [0],
            shadeClose: true, //开启遮罩关闭
            area: ['600px', '260px'],
            anim: 2,
            content: '<form class="layui-form layui-form-pane">' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label">发起者</label>' +
            '<div class="layui-input-block">' +
            '<input id="script" type="text" name="title" placeholder="" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label">进程说明</label>' +
            '<div class="layui-input-block">' +
            '<input id="process_explain" type="text" name="title" placeholder="" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-6 mb-2">' +
            '<div id="submit_add_process" class="layui-btn layui-btn-primary"><i class="fa fa-check"></i></div>' +
            '<div type="reset" class="layui-btn layui-btn-primary pull-right"><i class="fa fa-reply"></i></div>' +
            '</div>' +
            '' +
            '</form>',
        });
    });

    /**
     * 确认添加进程
     */
    let getInput = function(url = 'http://php.io/process'){

        $('body').on('click', '#submit_add_process', function () {
            layer.closeAll();
            error.hide();
            table.hide();
            page_button.hide();
            loading.show();

            let script = $('#script');
            let process_explain = $('#process_explain');

            $.ajax({
                url: url,
                type: 'POST',
                data: {token: 123456, addProcess: 1, script: script.val(), explain: process_explain.val()},
                dataType: 'json',
                error: function () {
                    error.show();
                    table.hide();
                    loading.hide();
                    page_button.hide();
                },
                success: function () {
                    loading.hide();
                    setTimeout(location.reload(), 3000);
                }
            });

        })

    };
    getInput();

    /**
     * 刷新
     */
    refresh.click(function () {
        window.location.reload()
    });
};
//-------------------- /process.html

const equipmentConfig = function () {
    let tbody = $('tbody');
    let error = $('#error');
    let loading = $('#loading');
    let table = $('#table');
    let add_equipment = $('#add_equipment');
    let refresh = $('#refresh');

    error.hide();
    table.hide();

    let processList = document.getElementById('sensor_list');

    let template = doT.template
    (
        '{{~ it :value :key }}' +
        '<tr>' +
        '<td>{{= value.sensor_name }}</td>' +
        '<td>{{= value.sensor_id }}</td>' +
        '<td>{{= value.line }}</td>' +
        '<td>{{= value.min_gt }}</td>' +
        '<td>{{= value.min_lt }}</td>' +
        '<td>{{= value.normal_gt }}</td>' +
        '<td>{{= value.normal_lt }}</td>' +
        '<td>{{= value.max_gt }}</td>' +
        '<td>{{= value.max_lt }}</td>' +
        '<td>' +
        '<div class="text-center">' +
        '<div class="layui-btn-group">' +
        '<button class="layui-btn layui-btn-primary layui-btn-sm sensor_edit">' +
        '<i class="fa fa-edit"></i>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '</tr>' +
        '{{~ }}'
    );

    let sensorList = function (url = 'http://php.io/equipment') {

        $.ajax({
            url: url,
            type: 'POST',
            data: {AllEquipmentList: 1},
            dataType: 'json',
            error: function () {
                error.show();
                table.hide();
                loading.hide();
            },
            success: function (data) {
                error.hide();
                loading.hide();
                table.show();
                /**
                 * 拼接列表
                 */
                processList.innerHTML = template(data['data'][0][0]);
            }
        });
    };
    sensorList();

    let showLayer = function(title){
        let content = '<form class="layui-form layui-form-pane">' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label">设备名称</label>' +
            '<div class="layui-input-block">' +
            '<input id="sensor_name" type="text" placeholder="请输入设备名称" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label">设备代号</label>' +
            '<div class="layui-input-block">' +
            '<input id="sensor_id" type="text" placeholder="请输入设备代号" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label">基准线</label>' +
            '<div class="layui-input-block">' +
            '<input id="line" type="text" placeholder="请输入基准线" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-up text-yellow"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="min_lt" type="text" placeholder="请输入最低下限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-down text-yellow"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="min_gt" type="text" placeholder="请输入最低上限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-up text-default"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="normal_lt" type="text" placeholder="请输入正常上限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-down text-default"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="normal_gt" type="text" placeholder="请输入正常下限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-up text-red"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="max_lt" type="text" placeholder="请输入最高上限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-2 mb-2">' +
            '<label class="layui-form-label"><i class="fa fa-chevron-down text-red"></i></label>' +
            '<div class="layui-input-block">' +
            '<input id="max_gt" type="text" placeholder="请输入最高下限" class="layui-input">' +
            '</div>' +
            '</div>' +
            '' +
            '' +
            '<div class="layui-form-item ml-6 mr-6 mt-6 mb-2">' +
            '<div id="ok" class="layui-btn layui-btn-primary"><i class="fa fa-check"></i></div>' +
            '<button type="reset" class="layui-btn layui-btn-primary pull-right"><i class="fa fa-reply"></i></button>' +
            '</div>' +
            '' +
            '</form>';
        layer.open({
            type: 1,
            title: title,
            shade: [0],
            shadeClose: true, //开启遮罩关闭
            area: ['680px', '580px'],
            anim: 2,
            content: content,
        });
    };

    /**
     * 点击编辑
     */
    tbody.on('click', '.sensor_edit', function () {

        showLayer('修改\40' + $(this).parent().parent().parent().siblings('td:eq(0)').text() + '<span id="val" data-id=""></span>');

        /**
         * 确认修改
         */
        $('#val').attr('data-id', $(this).parent().parent().parent().siblings('td:eq(1)').text());

    });


    $('body').on('click', '#ok', function () {

        let sensor_id = $('#sensor_id').val();
        let sensor_name = $('#sensor_name').val();
        let line = $('#line').val();
        let min_gt = $('#min_gt').val();
        let min_lt = $('#min_lt').val();
        let normal_gt = $('#normal_gt').val();
        let normal_lt = $('#normal_lt').val();
        let max_gt = $('#max_gt').val();
        let max_lt = $('#max_lt').val();

        $.ajax({
            url: 'http://php.io/equipment',
            type: 'POST',

            data: {updateEquipment: 1, var:$('#val').attr('data-id'), sensor_id: sensor_id, sensor_name: sensor_name,
                line: line, min_gt: min_gt, min_lt: min_lt, normal_gt: normal_gt, normal_lt: normal_lt, max_gt: max_gt,
                max_lt: max_lt},

            dataType: 'json',
            error: function () {
            },
            success: function () {
                location.reload()
            }
        });
    });

    add_equipment.click(function () {
        layer.msg('还在考虑到底加不加这个功能', {icon: 1});
        //showLayer('增加\40设备')
    });

    refresh.click(function () {
        window.location.reload()
    });
};


