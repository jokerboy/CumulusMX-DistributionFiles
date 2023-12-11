// Last modified: 2023/12/05 00:11:52

let accessMode;

$(document).ready(function() {
    $.ajax({
        url: "api/info/units.json",
        dataType: "json",
        success: function (result) {
            let units = result;

            $("form").alpaca({
                "dataSource": "./api/settings/calibrationdata.json",
                "optionsSource": "./json/CalibrationOptions.json",
                "schemaSource": "./json/CalibrationSchema.json",
                "ui": "bootstrap",
                "view": "bootstrap-edit-horizontal",
                "options": {
                    "form": {
                        "buttons": {
                            // don't use the Submit button because that is disabled on validation errors
                            "validate": {
                                "title": "Save Settings",
                                "click": function() {
                                    this.refreshValidationState(true);
                                    if (this.isValid(true)) {
                                        let json = this.getValue();

                                        $.ajax({
                                            type: "POST",
                                            url: "../api/setsettings/updatecalibrationconfig.json",
                                            data: {json: JSON.stringify(json)},
                                            dataType: "text"
                                        })
                                        .done(function () {
                                            alert("Settings updated");
                                        })
                                        .fail(function (jqXHR, textStatus) {
                                            alert("Error: " + jqXHR.status + "(" + textStatus + ") - " + jqXHR.responseText);
                                        });
                                    } else {
                                        let firstErr = $('form').find(".has-error:first")
                                        let path = $(firstErr).attr('data-alpaca-field-path');
                                        let msg = $(firstErr).children('.alpaca-message').text();
                                        alert("Invalid value in the form: " + path + msg);
                                        if ($(firstErr).is(":visible")) {
                                            let entry = $(firstErr).focus();
                                            $(window).scrollTop($(entry).position().top);
                                        }
                                    }
                                },
                                "styles": "alpaca-form-button-submit"
                            }
                        }
                    }
                },
                "postRender": function (form) {
                    // Change in accessibility is enabled
                    let accessObj = form.childrenByPropertyId["accessible"];
                    onAccessChange(null, accessObj.getValue());
                    accessMode = accessObj.getValue();

                    // Trigger changes is the accessibility mode is changed
                    //accessObj.on("change", function() {onAccessChange(this)});

                    if (!accessMode) {
                        setCollapsed();  // sets the class and aria attribute missing on first load by Alpaca
                    }

                    // add units to the labels
                    setlabel(form.getControlByPath('pressure/limitmin'), units.press);
                    setlabel(form.getControlByPath('pressure/limitmax'), units.press);
                    setlabel(form.getControlByPath('pressure/offset'), units.press);
                    setlabel(form.getControlByPath('pressure/spike'), units.press);

                    let tempStr = '°' + units.temp;
                    setlabel(form.getControlByPath('temp/limitmin'), tempStr);
                    setlabel(form.getControlByPath('temp/limitmax'), tempStr);
                    setlabel(form.getControlByPath('temp/offset'), tempStr);
                    setlabel(form.getControlByPath('temp/spike'), tempStr);

                    setlabel(form.getControlByPath('tempin/offset'), tempStr);
                    setlabel(form.getControlByPath('tempin/spike'), tempStr);

                    setlabel(form.getControlByPath('hum/offset'), '%');
                    setlabel(form.getControlByPath('hum/spike'), '%');

                    setlabel(form.getControlByPath('humin/offset'), '%');
                    setlabel(form.getControlByPath('humin/spike'), '%');

                    setlabel(form.getControlByPath('windspd/spike'), units.wind);

                    setlabel(form.getControlByPath('gust/spike'), units.wind);
                    setlabel(form.getControlByPath('gust/limitmax'), units.wind);

                    setlabel(form.getControlByPath('rain/spikerate'), units.rain + '/h');
                    setlabel(form.getControlByPath('rain/spikehour'), units.rain);

                    setlabel(form.getControlByPath('dewpt/limitmax'), tempStr);

                    setlabel(form.getControlByPath('wetbulb/offset'), tempStr);
                }
            });
        }
    });
});

function addButtons() {
    $('form legend').each(function () {
        let span = $('span:first',this);
        if (span.length === 0)
            return;

            let butt = $('<button type="button" data-toggle="collapse" data-target="' +
            $(span).attr('data-target') +
            '" role="treeitem" aria-expanded="false" class="collapsed">' +
            $(span).text() +
            '</button>');
        $(span).remove();
        $(this).prepend(butt);
    });
}

function removeButtons() {
    $('form legend').each(function () {
        let butt = $('button:first',this);
        if (butt.length === 0)
            return;

            let span = $('<span data-toggle="collapse" data-target="' +
            $(butt).attr('data-target') +
            '" role="treeitem" aria-expanded="false" class="collapsed">' +
            $(butt).text() +
            '</span>');
        $(butt).remove();
        $(this).prepend(span);
    });
}

function setCollapsed() {
    $('form div.alpaca-container.collapse').each(function () {
        let span = $(this).siblings('legend:first').children('span:first');
        if ($(this).hasClass('in')) {
            span.attr('role', 'treeitem');
            span.attr('aria-expanded', true);
        } else {
            span.attr('role', 'treeitem');
            span.attr('aria-expanded', false);
            span.addClass('collapsed')
        }
    });
}

function getCSSRule(search) {
    for (let x = 0; x < document.styleSheets.length; x++) {
        let rules = document.styleSheets[x].rules || document.styleSheets[x].cssRules;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText && rules[i].selectorText.lastIndexOf(search) === 0  && search.length === rules[i].selectorText.length) {
                return rules[i];
            }
        }
    }
    return null;
}

function onAccessChange(that, val) {
    let mode = val == null ? that.getValue() : val;
    if (mode == accessMode) {
        return;
    }

    let expandable = getCSSRule('.alpaca-field > legend > .collapsed::before');
    let expanded = getCSSRule('.alpaca-field > legend > span::before');

    accessMode = mode;
    if (mode) {
        expandable.style.setProperty('display','none');
        expanded.style.setProperty('display','none');
        addButtons();
    } else {
        expandable.style.removeProperty('display');
        expanded.style.removeProperty('display');
        removeButtons();
    }
}

function setlabel(that, val) {
    let label = that.options.label;
    label += " (" + val + "):";
    that.options.label = label;
    that.refresh();
}
