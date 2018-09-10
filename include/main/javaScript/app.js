!function () {

    windowsLimit();

    if (window.location.pathname.indexOf('equipment.html') === 1)
    {
        drawChart('http://php.io/equipment', 'ph');
        renderEquipmentTab();
        clickEquipmentTab();
    }

    if (window.location.pathname.indexOf('process.html') === 1)
    {
        processPageList();
    }

    if (window.location.pathname.indexOf('equipmentConfig.html') === 1)
    {
        equipmentConfig();
    }
}(jQuery);
