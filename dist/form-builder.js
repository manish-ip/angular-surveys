angular.module('mwFormBuilder', ['ngSanitize','ng-sortable', 'pascalprecht.translate']);

angular.module('mwFormBuilder')
    .service('mwFormUuid', function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        this.get = function () {
            return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();


        };
    })
    .factory('mwFormClone', ["mwFormUuid", function (mwFormUuid) {
        var service = {};
        var checkedObjects = [];

        service.resetIds = function (obj, root) {
            if (root) {
                checkedObjects = [];
            }
            if (checkedObjects.indexOf(obj) >= 0) {
                return;
            }
            checkedObjects.push(obj);
            if (!obj === Object(obj)) {
                return;
            }

            if (Array.isArray(obj)) {
                obj.forEach(service.resetIds);
                return;
            }

            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    service.resetIds(obj[property]);
                }
            }

            if (obj.hasOwnProperty('id')) {
                var newId = mwFormUuid.get();
                var oldId = obj.id;
                obj.id = newId;
            }
        };

        service.cloneElement = function (pageElement) {
            var element = {};
            angular.copy(pageElement, element);
            service.resetIds(element, true);
            return element;
        };

        service.clonePage = function (formPage) {
            var _page = {};
            angular.copy(formPage, _page);
            _page.id = mwFormUuid.get();
            var _elements = [];
            if (Array.isArray(formPage.elements)) {
                for (var i = 0; i < formPage.elements.length; i++) {
                    _elements.push(service.cloneElement(formPage.elements[i]));
                }
            }
            _page.elements = _elements;
            return _page;
        };

        service.cloneForm = function (form) {
            var _form = {};
            angular.copy(form, _form);
            var _pages = [];
            if (Array.isArray(form.pages)) {
                for (var i = 0; i < form.pages.length; i++) {
                    _pages.push(service.clonePage(form.pages[i]));
                }
            }
            _form.pages = _pages;
            return _form;
        };

        return service;

    }]);


angular.module('mwFormBuilder').directive('mwQuestionPriorityListBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormQuestionBuilder',
        scope: {
            question: '=',
            readOnly: '=?',
            options: '=?'
        },
        // templateUrl: 'mw-question-priority-list-builder.html',
        template: '<div class=mw-question-priority-list-builder><div class=question-priority-list ng-sortable=ctrl.itemsSortableConfig ng-model=ctrl.question.priorityList role=list><div class=mw-question-priority-list-item ng-repeat="item in ctrl.question.priorityList" role=listitem><div class=drag-handle ng-if=!ctrl.readOnly><i class="fa fa-arrows-v fa-lg handle-inner"></i></div><input wd-focus-me=ctrl.isNewItem[item.id] type=text ng-model=item.value ng-keypress=ctrl.keyPressedOnInput($event,item) required class="form-control item-value" ng-readonly=ctrl.readOnly> <button role=button class=remove-item-button ng-click=ctrl.removeItem(item) ng-if=!ctrl.readOnly><i class="fa fa-times"></i></button></div></div><div class="mw-question-priority-list-item add-new-item-widget" ng-if=!ctrl.readOnly><div class=drag-handle></div><span ng-click=ctrl.addNewItem() role=button><input type=text required class=form-control value="{{\'mwForm.question.priority.clickToAddItem\'|translate}}"></span></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", function(mwFormUuid){
            var ctrl = this;
            ctrl.isNewItem = {};

            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            this.$onInit = function() {
                if(!ctrl.question.priorityList){
                    ctrl.question.priorityList = [];
                    ctrl.addNewItem();
                }

                sortByOrderNo(ctrl.question.priorityList);

                ctrl.itemsSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateOrderNo(ctrl.question.priorityList);
                    }
                };
            };

            ctrl.addNewItem=function(noFocus){

                var item = {
                    id: mwFormUuid.get(),
                    orderNo: ctrl.question.priorityList.length + 1,
                    value: null
                };
                if(!noFocus){
                    ctrl.isNewItem[item.id]=true;
                }

                ctrl.question.priorityList.push(item);
            };

            function updateOrderNo(array) {
                if(array){
                    for(var i=0; i<array.length; i++){
                        var item = array[i];
                        item.orderNo = i+1;
                    }
                }

            }

            function sortByOrderNo(array) {
                array.sort(function (a, b) {
                   return a.orderNo - b.orderNo;
               });
            }

            ctrl.removeItem=function(item){
                var index =  ctrl.question.priorityList.indexOf(item);
                if(index!=-1){
                    ctrl.question.priorityList.splice(index,1);
                }
            };

            ctrl.keyPressedOnInput= function(keyEvent, item){
                delete ctrl.isNewItem[item.id];
                if (keyEvent.which === 13){
                    keyEvent.preventDefault();
                    ctrl.addNewItem();
                }
            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                this.$onInit();
            }
        }],
        link: function (scope, ele, attrs, formQuestionBuilderCtrl){
            var ctrl = scope.ctrl;
        }
    };
});


angular.module('mwFormBuilder').directive('mwQuestionOfferedAnswerListBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormQuestionBuilder',
        scope: {
            question: '=',
            formObject: '=',
            readOnly: '=?',
            options: '=?',
            disableOtherAnswer: '=?'
        },
        // templateUrl: 'mw-question-offered-answer-list-builder.html',
        template: '<div class=question-offered-answer-list-builder><div class=question-offered-answer-list ng-sortable=ctrl.offeredAnswersSortableConfig ng-model=ctrl.question.offeredAnswers role=list><div class=mw-question-offered-answer ng-repeat="answer in ctrl.question.offeredAnswers" role=listitem><div class=drag-handle ng-if=!ctrl.readOnly><i class="fa fa-arrows-v fa-lg handle-inner"></i></div><div class=option-type-indicator><i ng-if="ctrl.question.type==\'radio\'" class="fa fa-circle-thin fa-fw"></i> <i ng-if="ctrl.question.type==\'checkbox\'" class="fa fa-square-o fa-fw"></i></div><input wd-focus-me=ctrl.isNewAnswer[answer.id] type=text ng-model=answer.value ng-keypress=ctrl.keyPressedOnInput($event,answer) required class="form-control offered-answer-value" ng-readonly=ctrl.readOnly> <button role=button class=remove-item-button ng-click=ctrl.removeOfferedAnswer(answer) ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.remove\' | translate}}" uib-popover="{{\'mwForm.buttons.remove\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-times"></i></button> <span ng-if=ctrl.question.pageFlowModifier class=form-inline><select ng-options="pageFlow.label|translate:pageFlow for pageFlow in ctrl.possiblePageFlow" ng-model=answer.pageFlow class=form-control ng-disabled=ctrl.readOnly></select></span></div></div><div class="mw-question-offered-answer add-new-answer-widget" ng-if=!ctrl.readOnly><div class=drag-handle></div><div class=option-type-indicator><i ng-if="ctrl.question.type==\'radio\'" class="fa fa-circle-thin fa-fw"></i> <i ng-if="ctrl.question.type==\'checkbox\'" class="fa fa-square-o fa-fw"></i></div><span ng-click=ctrl.addNewOfferedAnswer() role=button><input type=text class="form-control offered-answer-value" value="{{\'mwForm.question.buttons.addOption\'|translate}}"></span> <span class=add-custom-answer ng-if="!ctrl.disableOtherAnswer && !ctrl.question.otherAnswer"><span translate=mwForm.question.orLabel>lub</span> <button role=button ng-click=ctrl.addCustomAnswer() translate=mwForm.question.buttons.addOther>Dodaj "Inne"</button></span></div><div class="mw-question-offered-answer custom-answer" ng-if=ctrl.question.otherAnswer><div class=drag-handle ng-if=!ctrl.readOnly></div><div class=option-type-indicator><i ng-if="ctrl.question.type==\'radio\'" class="fa fa-circle-thin fa-fw"></i> <i ng-if="ctrl.question.type==\'checkbox\'" class="fa fa-square-o fa-fw"></i></div><label translate=mwForm.question.otherLabel>Inna:</label> <input type=text value="{{\'mwForm.question.userAnswer\'|translate}}" class="form-control offered-answer-value" readonly> <button type=button role=button class=remove-item-button ng-click=ctrl.removeCustomAnswer() ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.remove\' | translate}}" uib-popover="{{\'mwForm.buttons.remove\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-times"></i></button></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["FormQuestionBuilderId", "mwFormUuid", function(FormQuestionBuilderId, mwFormUuid){
            var ctrl = this;

            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            this.$onInit = function() {
                ctrl.config={
                    radio:{},
                    checkbox:{}
                };

                ctrl.isNewAnswer = {};

                sortAnswersByOrderNo();

                ctrl.offeredAnswersSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateAnswersOrderNo();
                    }
                };
            };


            function updateAnswersOrderNo() {
                if(ctrl.question.offeredAnswers){
                    for(var i=0; i<ctrl.question.offeredAnswers.length; i++){

                        var offeredAnswer = ctrl.question.offeredAnswers[i];

                        offeredAnswer.orderNo = i+1;
                    }
                }

            }

            function sortAnswersByOrderNo() {
                if(ctrl.question.offeredAnswers) {
                    ctrl.question.offeredAnswers.sort(function (a, b) {
                        return a.orderNo - b.orderNo;
                    });
                }
            }

            ctrl.addNewOfferedAnswer=function(){

                var defaultPageFlow = ctrl.possiblePageFlow[0];

                var answer = {
                    id: mwFormUuid.get(),
                    orderNo: ctrl.question.offeredAnswers.length + 1,
                    value: null,
                    pageFlow:defaultPageFlow
                };
                ctrl.isNewAnswer[answer.id]=true;
                ctrl.question.offeredAnswers.push(answer);
            };

            ctrl.removeOfferedAnswer=function(answer){
                var index = ctrl.question.offeredAnswers.indexOf(answer);
                if(index!=-1){
                    ctrl.question.offeredAnswers.splice(index,1);
                }
            };

            ctrl.addCustomAnswer=function(){
                ctrl.question.otherAnswer=true;
            };
            ctrl.removeCustomAnswer=function(){
                ctrl.question.otherAnswer=false;
            };

            ctrl.keyPressedOnInput= function(keyEvent, answer){
                delete ctrl.isNewAnswer[answer.id];
                if (keyEvent.which === 13){
                    keyEvent.preventDefault()
                    ctrl.addNewOfferedAnswer();
                }


            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                this.$onInit();
            }
        }],
        link: function (scope, ele, attrs, formQuestionBuilderCtrl){
            var ctrl = scope.ctrl;
            ctrl.possiblePageFlow = formQuestionBuilderCtrl.possiblePageFlow;
        }
    };
});


angular.module('mwFormBuilder').directive('mwQuestionGridBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormQuestionBuilder',
        scope: {
            question: '=',
            formObject: '=',
            readOnly: '=?',
            options: '=?'
        },
        // templateUrl: 'mw-question-grid-builder.html',
        template: '<div class=mw-question-grid-builder><div class=form-horizontal><div class=form-group><mw-label label-for=mw-grid-cell-input-type-{{ctrl.question.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.grid.cellInputType></mw-label><div class="col-sm-10 form-inline"><select ng-attr-id=mw-grid-cell-input-type-{{ctrl.question.id}} ng-model=ctrl.question.grid.cellInputType ng-options="\'mwForm.question.grid.cellInputTypes.\'+opt|translate for opt in ctrl.cellInputTypes" class=form-control ng-disabled=ctrl.readOnly required></select></div></div></div><div class="form-horizontal mw-grid-rows-builder"><div class=mw-grid-row-list ng-sortable=ctrl.rowsSortableConfig ng-model=ctrl.question.grid.rows role=list><div class="mw-grid-item form-group" ng-repeat="row in ctrl.question.grid.rows" role=listitem><mw-label label-for=mw-grid-row-{{row.id}}-label label-class="col-sm-2 control-label" label-key=mwForm.question.grid.rowLabel label-translate-values="{row: row.orderNo}"></mw-label><div class="col-sm-10 col-md-8"><div class=drag-handle><i class="fa fa-arrows-v fa-lg handle-inner"></i></div><input ng-attr-id=mw-grid-row-{{row.id}}-label wd-focus-me=ctrl.isNewInput[row.id] type=text ng-model=row.label ng-keypress="ctrl.keyPressedOnInput($event,row, \'row\')" required class="form-control mw-item-label-value" ng-readonly=ctrl.readOnly> <button role=button class=remove-item-button ng-click=ctrl.removeRow(row) ng-if=!ctrl.readOnly><i class="fa fa-times"></i></button></div></div></div><div class="mw-grid-item form-group add-new-item-widget" ng-if=!ctrl.readOnly><label class="col-sm-2 control-label" translate=mwForm.question.grid.rowLabel translate-values="{row: ctrl.question.grid.rows.length+1}">Etykieta wiersza {{ctrl.question.grid.rows.length+1}}</label><div class="col-sm-10 col-md-8"><div class=drag-handle></div><span ng-click=ctrl.addNewRow() role=button><input type=text required class=form-control value="{{\'mwForm.question.grid.clickToAddRow\'|translate}}"></span></div></div></div><div class=row><div class="mw-grid-separator col-sm-9 col-sm-offset-1"></div></div><div class="form-horizontal mw-grid-cols-builder"><div class=mw-grid-col-list ng-sortable=ctrl.colsSortableConfig ng-model=ctrl.question.grid.cols role=list><div class="mw-grid-item form-group" ng-repeat="col in ctrl.question.grid.cols" role=listitem><mw-label label-for=mw-grid-col-{{col.id}}-label label-class="col-sm-2 control-label" label-key=mwForm.question.grid.columnLabel label-translate-values="{col: col.orderNo}"></mw-label><div class="col-sm-10 col-md-8"><div class=drag-handle><i class="fa fa-arrows-v fa-lg handle-inner"></i></div><input ng-attr-id=mw-grid-col-{{col.id}}-label wd-focus-me=ctrl.isNewInput[col.id] type=text ng-model=col.label ng-keypress="ctrl.keyPressedOnInput($event,col, \'col\')" required class="form-control mw-item-label-value" ng-readonly=ctrl.readOnly> <button role=button class=remove-item-button ng-click=ctrl.removeCol(col) ng-if=!ctrl.readOnly><i class="fa fa-times"></i></button></div></div></div><div class="mw-grid-item form-group add-new-item-widget" ng-if=!ctrl.readOnly><label class="col-sm-2 control-label" translate=mwForm.question.grid.columnLabel translate-values="{col: ctrl.question.grid.cols.length+1}">Etykieta kolumny {{ctrl.question.grid.cols.length+1}}</label><div class="col-sm-10 col-md-8"><div class=drag-handle></div><span ng-click=ctrl.addNewCol() role=button><input type=text required class=form-control value="{{\'mwForm.question.grid.clickToAddColumn\'|translate}}"></span></div></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", "MW_GRID_CELL_INPUT_TYPES", function(mwFormUuid, MW_GRID_CELL_INPUT_TYPES){
            var ctrl = this;

            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            this.$onInit = function() {
                ctrl.cellInputTypes = MW_GRID_CELL_INPUT_TYPES;
                ctrl.isNewInput = {};

                if(!ctrl.question.grid){

                    ctrl.question.grid = {
                        rows:[],
                        cols:[]
                    };
                    ctrl.addNewRow();
                    ctrl.addNewCol(true);
                }

                if(!ctrl.question.grid.cellInputType){
                    ctrl.question.grid.cellInputType = ctrl.cellInputTypes[0];
                }



                sortByOrderNo(ctrl.question.grid.rows);
                sortByOrderNo(ctrl.question.grid.cols);

                ctrl.rowsSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateOrderNo(ctrl.question.grid.rows);
                    }
                };
                ctrl.colsSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateOrderNo(ctrl.question.grid.cols);
                    }
                };
            };





            ctrl.addNewRow=function(noFocus){

                var row = {
                    id: mwFormUuid.get(),
                    orderNo: ctrl.question.grid.rows.length + 1,
                    label: null
                };
                if(!noFocus){
                    ctrl.isNewInput[row.id]=true;
                }

                ctrl.question.grid.rows.push(row);
            };

            ctrl.addNewCol=function(noFocus){

                var col = {
                    id: mwFormUuid.get(),
                    orderNo: ctrl.question.grid.cols.length + 1,
                    label: null
                };
                if(!noFocus){
                    ctrl.isNewInput[col.id]=true;
                }

                ctrl.question.grid.cols.push(col);
            };



            function updateOrderNo(array) {
                if(array){
                    for(var i=0; i<array.length; i++){
                        var item = array[i];
                        item.orderNo = i+1;
                    }
                }

            }

            function sortByOrderNo(array) {
                array.sort(function (a, b) {
                   return a.orderNo - b.orderNo;
               });
            }

            ctrl.removeRow=function(row){
                var index =  ctrl.question.grid.rows.indexOf(row);
                if(index!=-1){
                    ctrl.question.grid.rows.splice(index,1);
                }
            };
            ctrl.removeCol=function(col){
                var index =  ctrl.question.grid.cols.indexOf(col);
                if(index!=-1){
                    ctrl.question.grid.cols.splice(index,1);
                }
            };

            ctrl.keyPressedOnInput= function(keyEvent, input, type){
                delete ctrl.isNewInput[input.id];
                if (keyEvent.which === 13){
                    keyEvent.preventDefault();
                    if(type=='row'){
                        ctrl.addNewRow();
                    }else{
                        ctrl.addNewCol();
                    }

                }


            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                this.$onInit();
            }
        }],
        link: function (scope, ele, attrs, formQuestionBuilderCtrl){
            var ctrl = scope.ctrl;
        }
    };
});


angular.module('mwFormBuilder').directive('mwQuestionDivisionBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormQuestionBuilder',
        scope: {
            question: '=',
            readOnly: '=?',
            options: '=?'
        },
        // templateUrl: 'mw-question-division-builder.html',
        template: '<div class=mw-question-division-builder><div class=form-horizontal><div class=form-group><mw-label label-for=division-quantity-{{ctrl.question.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.division.quantity></mw-label><div class="col-sm-10 col-md-8 form-inline"><input ng-attr-id=division-quantity-{{ctrl.question.id}} type=number ng-model=ctrl.question.quantity required class=form-control min=1 ng-readonly=ctrl.readOnly></div></div><div class=form-group><mw-label label-for=division-unit-{{ctrl.question.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.division.unit></mw-label><div class="col-sm-10 col-md-8 form-inline"><input ng-attr-id=division-unit-{{ctrl.question.id}} type=text ng-model=ctrl.question.unit required class=form-control ng-readonly=ctrl.readOnly></div></div></div><div class="col-sm-10 col-sm-offset-2 col-md-8"><div class=question-division-list ng-sortable=ctrl.itemsSortableConfig ng-model=ctrl.question.divisionList role=list><div class=mw-question-division-list-item ng-repeat="item in ctrl.question.divisionList" role=listitem><div class=drag-handle ng-if=!ctrl.readOnly><i class="fa fa-arrows-v fa-lg handle-inner"></i></div><input wd-focus-me=ctrl.isNewItem[item.id] type=text ng-model=item.value ng-keypress=ctrl.keyPressedOnInput($event,item) required class="form-control item-value" ng-readonly=ctrl.readOnly> <button role=button class=remove-item-button ng-click=ctrl.removeItem(item) ng-if=!ctrl.readOnly><i class="fa fa-times"></i></button></div></div><div class="mw-question-division-list-item add-new-item-widget"><div class=drag-handle></div><span ng-click=ctrl.addNewItem() role=button ng-if=!ctrl.readOnly><input type=text required class=form-control value="Kliknij aby dodać pozycję"></span></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", function(mwFormUuid){
            var ctrl = this;
            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                ctrl.isNewItem = {};
                if(!ctrl.question.divisionList){
                    ctrl.question.divisionList = [];
                    ctrl.addNewItem();
                }
                sortByOrderNo(ctrl.question.divisionList);

                ctrl.itemsSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateOrderNo(ctrl.question.divisionList);
                    }
                };
            };


            ctrl.addNewItem=function(noFocus){

                var item = {
                    id: mwFormUuid.get(),
                    orderNo: ctrl.question.divisionList.length + 1,
                    value: null
                };
                if(!noFocus){
                    ctrl.isNewItem[item.id]=true;
                }

                ctrl.question.divisionList.push(item);
            };


            function updateOrderNo(array) {
                if(array){
                    for(var i=0; i<array.length; i++){
                        var item = array[i];
                        item.orderNo = i+1;
                    }
                }

            }

            function sortByOrderNo(array) {
                array.sort(function (a, b) {
                   return a.orderNo - b.orderNo;
               });
            }

            ctrl.removeItem=function(item){
                var index =  ctrl.question.divisionList.indexOf(item);
                if(index!=-1){
                    ctrl.question.divisionList.splice(index,1);
                }
            };

            ctrl.keyPressedOnInput= function(keyEvent, item){
                delete ctrl.isNewItem[item.id];
                if (keyEvent.which === 13){
                    keyEvent.preventDefault();
                    ctrl.addNewItem();
                }
            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }
        }],
        link: function (scope, ele, attrs, formQuestionBuilderCtrl){
            var ctrl = scope.ctrl;
        }
    };
});


angular.module('mwFormBuilder').directive('mwLabel', function () {

    return {
        replace: true,
        restrict: 'AE',
        scope: {
            labelKey: "@?",
            labelText: "@?",
            labelFor: "@",
            labelClass: "@",
            labelTranslateValues: "="
        },
        // templateUrl: 'mw-label.html',
        template: '<label ng-attr-for={{::ctrl.labelFor}} ng-attr-class={{::ctrl.labelClass}}>{{ctrl.labelKey|translate:ctrl.labelTranslateValues}}</label>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", function(mwFormUuid){
            var ctrl = this;
        }],
        link: function (scope, ele, attrs){

        }
    };
});


angular.module('mwFormBuilder').factory("FormQuestionBuilderId", function(){
    var id = 0;
        return {
            next: function(){
                return ++id;
            }
        }
    })

    .directive('mwFormQuestionBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormPageElementBuilder',
        scope: {
            question: '=',
            formObject: '=',
            onReady: '&',
            isPreview: '=?',
            readOnly: '=?'
        },
        // templateUrl: 'mw-form-question-builder.html',
        // template: '<div class=mw-form-question-builder-wrapper><div class=mw-form-question-builder ng-class="{\'ng-submitted\':ctrl.formSubmitted}"><div ng-form=ctrl.form ng-if=!ctrl.isPreview><div class=form-horizontal><div class=form-group><mw-label label-for=question-text-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.text></mw-label><div class="col-sm-10 col-md-8"><input type=text class=form-control name=text ng-attr-id=question-text-{{ctrl.id}} ng-model=ctrl.question.text ng-readonly=ctrl.readOnly required></div></div><div class="form-group mw-question-type"><mw-label label-for=question-type-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.type></mw-label><div class="col-sm-10 form-inline"><select ng-attr-id=question-type-{{ctrl.id}} ng-options="\'mwForm.question.types.\'+type+\'.name\'|translate for type in ctrl.questionTypes" ng-model=ctrl.question.type ng-change=ctrl.questionTypeChanged() class=form-control ng-disabled=ctrl.readOnly required></select><div class=checkbox ng-if="ctrl.question.type==\'radio\' || ctrl.question.type==\'select\'"><label><input type=checkbox ng-model=ctrl.question.pageFlowModifier ng-change=ctrl.pageFlowModifierChanged() ng-readonly=ctrl.readOnly> <span translate=mwForm.pageFlow.afterQuestionAnswer>Przejdź do strony w oparciu o odpowiedź</span></label></div></div></div><div class="form-group mw-question-type" ng-repeat="select in ctrl.options.customQuestionSelects"><mw-label label-for=question-{{select.key}}-{{ctrl.id}} label-class="col-sm-2 control-label" label-key={{select.label}}></mw-label><div class="col-sm-10 form-inline"><select ng-attr-id=question-{{opt.key}}-{{ctrl.id}} ng-options="opt.label for opt in select.options track by opt.key" ng-model=ctrl.question[select.key] class=form-control ng-disabled=ctrl.readOnly ng-required=select.required></select></div></div></div><div class=row ng-if=ctrl.question.type><div class="mw-form-question-answers-builder col-sm-10 col-sm-offset-2 col-md-8" ng-switch=ctrl.question.type><div ng-if="ctrl.question.type==\'text\'"><input class=form-control type=text disabled value="{{\'mwForm.question.preview.text\'|translate}}"></div><div ng-switch-when=textarea><textarea class=form-control disabled>{{\'mwForm.question.preview.textarea\'|translate}}</textarea></div><div ng-switch-when=radio><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly></mw-question-offered-answer-list-builder></div><div ng-switch-when=select><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly disable-other-answer=true></mw-question-offered-answer-list-builder></div><div ng-switch-when=checkbox><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly></mw-question-offered-answer-list-builder></div><div ng-switch-when=priority><mw-question-priority-list-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-priority-list-builder></div><div ng-switch-when=number class=form-inline><div class="range-config form-inline"><span translate=mwForm.question.number.min>Min</span>: <input class=form-control type=number ng-model=ctrl.question.min max={{ctrl.question.max}} ng-readonly=ctrl.readOnly> <span translate=mwForm.question.number.max>Max</span>: <input class=form-control type=number min={{ctrl.question.min}} ng-model=ctrl.question.max ng-readonly=ctrl.readOnly></div><br><input class=form-control type=number disabled></div><div ng-switch-when=date class=form-inline><input class=form-control type=date disabled></div><div ng-switch-when=datetime class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=time class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=email class=form-inline><input class=form-control type=email disabled></div><div ng-switch-when=range><div class="range-config form-inline"><span translate=mwForm.question.range.from>Range from</span> <input class=form-control type=number ng-model=ctrl.question.min required ng-readonly=ctrl.readOnly> <span translate=mwForm.question.range.to>to</span> <input class=form-control type=number ng-model=ctrl.question.max required ng-readonly=ctrl.readOnly></div><br><div class=mw-range><input min=ctrl.question.min max=ctrl.question.max type=range disabled></div></div><div ng-switch-when=url class=form-inline><input class=form-control type=url disabled></div></div><div class=col-sm-12 ng-if="ctrl.question.type==\'grid\'"><mw-question-grid-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-grid-builder></div><div class=col-sm-12 ng-if="ctrl.question.type==\'division\'"><mw-question-division-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-division-builder></div></div><br><br><div class=row><div class=col-xs-2><button type=button class="btn btn-primary" ng-click=ctrl.save() translate=mwForm.buttons.questionReady>Gotowe</button></div><div class=col-xs-10><div class=checkbox><label><input type=checkbox ng-model=ctrl.question.required ng-disabled=ctrl.readOnly><span translate=mwForm.question.required>Required</span></label></div></div></div></div><div class=mw-preview ng-if=ctrl.isPreview><div class=mw-question-text>{{ctrl.question.text}} <span ng-if=ctrl.question.required>*</span></div><div class=question-answers ng-switch=ctrl.question.type><div ng-switch-when=text><input class=form-control type=text disabled value="{{\'mwForm.question.preview.text\'|translate}}"></div><div ng-switch-when=number class=form-inline><input class=form-control type=number disabled></div><div ng-switch-when=date class=form-inline><input class=form-control type=date disabled></div><div ng-switch-when=datetime class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=time class=form-inline><input class=form-control type=time disabled></div><div ng-switch-when=email class=form-inline><input class=form-control type=email disabled></div><div ng-switch-when=range class=mw-range><input ng-attr-min={{ctrl.question.min}} ng-attr-max={{ctrl.question.max}} type=range disabled></div><div ng-switch-when=url class=form-inline><input class=form-control type=url disabled></div><div ng-switch-when=textarea><textarea class=form-control type=text disabled>{{\'mwForm.question.preview.textarea\'|translate}}</textarea></div><div ng-switch-when=radio><div class=radio ng-repeat="answer in ctrl.question.offeredAnswers"><label><input type=radio> {{answer.value}}</label></div><div class=radio ng-if=ctrl.question.otherAnswer><label><input type=radio><span translate=mwForm.question.preview.otherAnswer>Inna</span>:</label> <span class=form-inline><input type=text class=form-control disabled></span></div></div><div ng-switch-when=checkbox><div class=checkbox ng-repeat="answer in ctrl.question.offeredAnswers"><label><input type=checkbox> {{answer.value}}</label></div><div class=checkbox ng-if=ctrl.question.otherAnswer><label><input type=checkbox><span translate=mwForm.question.preview.otherAnswer>Inna</span>:</label> <span class=form-inline><input type=text class=form-control disabled></span></div></div><div ng-switch-when=select><select class=form-control ng-disabled=true><option ng-repeat="answer in ctrl.question.offeredAnswers">{{answer.value}}</option></select></div><div ng-switch-when=grid><div class=table-responsive><table class="table table-condensed table-striped" border=0 cellpadding=5 cellspacing=0><thead><tr><td></td><td ng-repeat="col in ctrl.question.grid.cols"><label>{{col.label}}</label></td></tr></thead><tbody><tr ng-repeat="row in ctrl.question.grid.rows"><td>{{row.label}}</td><td ng-repeat="col in ctrl.question.grid.cols" ng-switch=ctrl.question.grid.cellInputType><input ng-switch-when=radio type=radio disabled> <input ng-switch-when=checkbox type=checkbox disabled> <input ng-switch-default ng-attr-type={{ctrl.question.grid.cellInputType}} disabled ng-class="\'form-control\'"></td></tr></tbody></table></div></div><div class=mw-priority-list ng-switch-when=priority><table><thead><tr><th translate=mwForm.question.priority.sorted>Sorted</th><th translate=mwForm.question.priority.available>Available</th></tr></thead><tbody><tr><td class=mw-ordered-items></td><td class=mw-available-items><div class=mw-item ng-repeat="item in ctrl.question.priorityList">{{::item.value}}</div></td></tr></tbody></table></div><div ng-switch-when=division><div class=form-inline style="margin-bottom: 5px" ng-repeat="item in ctrl.question.divisionList"><div class=form-group><label>{{item.value}}</label> <input type=number class=form-control style="width: 80px"> <span>{{ctrl.question.unit}}</span></div></div><div class=form-inline style="margin-bottom: 5px"><div class=form-group><label translate=mwForm.question.division.assignedSumLabel>Przydzielono</label> <input type=number class="form-control strict-validation" style="width: 80px" readonly value=0> <span>{{ctrl.question.unit}} <span translate=mwForm.question.division.fromRequiredLabel>z wymaganych</span> <strong>{{ctrl.question.quantity}}</strong> {{ctrl.question.unit}}</span></div></div></div></div></div></div></div>',
        template: '<div class=mw-form-question-builder-wrapper><div class=mw-form-question-builder ng-class="{\'ng-submitted\':ctrl.formSubmitted}"><div ng-form=ctrl.form ng-if=!ctrl.isPreview><div class=form-horizontal><div class=form-group><mw-label label-for=question-heading-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.heading></mw-label><div class="col-sm-10 col-md-8"><input type=text class=form-control name=textng-attr-id=question-heading-{{ctrl.id}} ng-model=ctrl.question.heading ng-readonly=ctrl.readOnly></div></div><div class=form-group><mw-label label-for=question-text-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.text></mw-label><div class="col-sm-10 col-md-8"><input type=text class=form-control name=text ng-attr-id=question-text-{{ctrl.id}} ng-model=ctrl.question.text ng-readonly=ctrl.readOnly required></div></div><div class=form-group><mw-label label-for=question-placeholder-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.placeholder></mw-label><div class="col-sm-10 col-md-8"><input type=text class=form-control name=text ng-attr-id=question-placeholder-{{ctrl.id}} ng-model=ctrl.question.placeholder ng-readonly=ctrl.readOnly></div></div><div class="form-group mw-question-type"><mw-label label-for=question-type-{{ctrl.id}} label-class="col-sm-2 control-label" label-key=mwForm.question.type></mw-label><div class="col-sm-10 form-inline"><select ng-attr-id=question-type-{{ctrl.id}} ng-options="\'mwForm.question.types.\'+type+\'.name\'|translate for type in ctrl.questionTypes" ng-model=ctrl.question.type ng-change=ctrl.questionTypeChanged() class=form-control ng-disabled=ctrl.readOnly required></select><div class=checkbox ng-if="ctrl.question.type==\'radio\' || ctrl.question.type==\'select\'"><label><input type=checkbox ng-model=ctrl.question.pageFlowModifier ng-change=ctrl.pageFlowModifierChanged() ng-readonly=ctrl.readOnly> <span translate=mwForm.pageFlow.afterQuestionAnswer>Przejdź do strony w oparciu o odpowiedź</span></label></div></div></div><div class="form-group mw-question-type" ng-repeat="select in ctrl.options.customQuestionSelects"><mw-label label-for=question-{{select.key}}-{{ctrl.id}} label-class="col-sm-2 control-label" label-key={{select.label}}></mw-label><div class="col-sm-10 form-inline"><select ng-attr-id=question-{{opt.key}}-{{ctrl.id}} ng-options="opt.label for opt in select.options track by opt.key" ng-model=ctrl.question[select.key] class=form-control ng-disabled=ctrl.readOnly ng-required=select.required></select></div></div></div><div class=row ng-if=ctrl.question.type><div class="mw-form-question-answers-builder col-sm-10 col-sm-offset-2 col-md-8" ng-switch=ctrl.question.type><div ng-if="ctrl.question.type==\'text\'"><input class=form-control type=text disabled value="{{\'mwForm.question.preview.text\'|translate}}"></div><div ng-switch-when=textarea><textarea class=form-control disabled>{{\'mwForm.question.preview.textarea\'|translate}}</textarea></div><div ng-switch-when=radio><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly></mw-question-offered-answer-list-builder></div><div ng-switch-when=select><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly disable-other-answer=true></mw-question-offered-answer-list-builder></div><div ng-switch-when=checkbox><mw-question-offered-answer-list-builder question=ctrl.question form-object=ctrl.formObject read-only=ctrl.readOnly></mw-question-offered-answer-list-builder></div><div ng-switch-when=priority><mw-question-priority-list-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-priority-list-builder></div><div ng-switch-when=number class=form-inline><div class="range-config form-inline"><span translate=mwForm.question.number.min>Min</span>: <input class=form-control type=number ng-model=ctrl.question.min max={{ctrl.question.max}} ng-readonly=ctrl.readOnly> <span translate=mwForm.question.number.max>Max</span>: <input class=form-control type=number min={{ctrl.question.min}} ng-model=ctrl.question.max ng-readonly=ctrl.readOnly></div><br><input class=form-control type=number disabled></div><div ng-switch-when=date class=form-inline><input class=form-control type=date disabled></div><div ng-switch-when=datetime class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=time class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=email class=form-inline><input class=form-control type=email disabled></div><div ng-switch-when=range><div class="range-config form-inline"><span translate=mwForm.question.range.from>Range from</span> <input class=form-control type=number ng-model=ctrl.question.min required ng-readonly=ctrl.readOnly> <span translate=mwForm.question.range.to>to</span> <input class=form-control type=number ng-model=ctrl.question.max required ng-readonly=ctrl.readOnly></div><br><div class=mw-range><input min=ctrl.question.min max=ctrl.question.max type=range disabled></div></div><div ng-switch-when=url class=form-inline><input class=form-control type=url disabled></div></div><div class=col-sm-12 ng-if="ctrl.question.type==\'grid\'"><mw-question-grid-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-grid-builder></div><div class=col-sm-12 ng-if="ctrl.question.type==\'division\'"><mw-question-division-builder question=ctrl.question read-only=ctrl.readOnly></mw-question-division-builder></div></div><br><br><div class=row><div class=col-xs-2><button type=button class="btn btn-primary" ng-click=ctrl.save() translate=mwForm.buttons.questionReady>Gotowe</button></div><div class=col-xs-10><div class=checkbox><label class="checkbox-inline customCheckbox checkbox-formbuilder"><input type=checkbox ng-model=ctrl.question.required ng-disabled=ctrl.readOnly><span><i class="fa fa-check"></i></span><span translate=mwForm.question.required>Required</span></label></div></div></div></div><div class=mw-preview ng-if=ctrl.isPreview><div class=mw-question-text>{{ctrl.question.heading}} <span ng-if=ctrl.question.required>*</span></div><div class=question-answers ng-switch=ctrl.question.type><div ng-switch-when=text><input class=form-control type=text disabled value="{{\'mwForm.question.preview.text\'|translate}}"></div><div ng-switch-when=number class=form-inline><input class=form-control type=number disabled></div><div ng-switch-when=date class=form-inline><input class=form-control type=date disabled></div><div ng-switch-when=datetime class=form-inline><input class=form-control type=datetime disabled></div><div ng-switch-when=time class=form-inline><input class=form-control type=time disabled></div><div ng-switch-when=email class=form-inline><input class=form-control type=email disabled></div><div ng-switch-when=range class=mw-range><input ng-attr-min={{ctrl.question.min}} ng-attr-max={{ctrl.question.max}} type=range disabled></div><div ng-switch-when=url class=form-inline><input class=form-control type=url disabled></div><div ng-switch-when=textarea><textarea class=form-control type=text disabled>{{\'mwForm.question.preview.textarea\'|translate}}</textarea></div><div ng-switch-when=radio><div class=radio ng-repeat="answer in ctrl.question.offeredAnswers"><label><input type=radio> {{answer.value}}</label></div><div class=radio ng-if=ctrl.question.otherAnswer><label><input type=radio><span translate=mwForm.question.preview.otherAnswer>Inna</span>:</label> <span class=form-inline><input type=text class=form-control disabled></span></div></div><div ng-switch-when=checkbox><div class=checkbox ng-repeat="answer in ctrl.question.offeredAnswers"><label><input type=checkbox> {{answer.value}}</label></div><div class=checkbox ng-if=ctrl.question.otherAnswer><label><input type=checkbox><span translate=mwForm.question.preview.otherAnswer>Inna</span>:</label> <span class=form-inline><input type=text class=form-control disabled></span></div></div><div ng-switch-when=select><select class=form-control ng-disabled=true><option ng-repeat="answer in ctrl.question.offeredAnswers">{{answer.value}}</option></select></div><div ng-switch-when=grid><div class=table-responsive><table class="table table-condensed table-striped" border=0 cellpadding=5 cellspacing=0><thead><tr><td></td><td ng-repeat="col in ctrl.question.grid.cols"><label>{{col.label}}</label></td></tr></thead><tbody><tr ng-repeat="row in ctrl.question.grid.rows"><td>{{row.label}}</td><td ng-repeat="col in ctrl.question.grid.cols" ng-switch=ctrl.question.grid.cellInputType><input ng-switch-when=radio type=radio disabled> <input ng-switch-when=checkbox type=checkbox disabled> <input ng-switch-default ng-attr-type={{ctrl.question.grid.cellInputType}} disabled ng-class="\'form-control\'"></td></tr></tbody></table></div></div><div class=mw-priority-list ng-switch-when=priority><table><thead><tr><th translate=mwForm.question.priority.sorted>Sorted</th><th translate=mwForm.question.priority.available>Available</th></tr></thead><tbody><tr><td class=mw-ordered-items></td><td class=mw-available-items><div class=mw-item ng-repeat="item in ctrl.question.priorityList">{{::item.value}}</div></td></tr></tbody></table></div><div ng-switch-when=division><div class=form-inline style="margin-bottom: 5px" ng-repeat="item in ctrl.question.divisionList"><div class=form-group><label>{{item.value}}</label> <input type=number class=form-control style="width: 80px"> <span>{{ctrl.question.unit}}</span></div></div><div class=form-inline style="margin-bottom: 5px"><div class=form-group><label translate=mwForm.question.division.assignedSumLabel>Przydzielono</label> <input type=number class="form-control strict-validation" style="width: 80px" readonly value=0> <span>{{ctrl.question.unit}} <span translate=mwForm.question.division.fromRequiredLabel>z wymaganych</span> <strong>{{ctrl.question.quantity}}</strong> {{ctrl.question.unit}}</span></div></div></div></div></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["$timeout", "FormQuestionBuilderId", "mwFormBuilderOptions", function($timeout,FormQuestionBuilderId, mwFormBuilderOptions){
            var ctrl = this;


            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                ctrl.id = FormQuestionBuilderId.next();
                ctrl.questionTypes = mwFormBuilderOptions.questionTypes;
                ctrl.formSubmitted=false;

                sortAnswersByOrderNo();

                ctrl.offeredAnswersSortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    handle: ".drag-handle",
                    onEnd: function(e, ui) {
                        updateAnswersOrderNo();
                    }
                };
            };


            function updateAnswersOrderNo() {
                if(ctrl.question.offeredAnswers){
                    for(var i=0; i<ctrl.question.offeredAnswers.length; i++){
                        ctrl.question.offeredAnswers[i].orderNo = i+1;
                    }
                }

            }

            function sortAnswersByOrderNo() {
                if(ctrl.question.offeredAnswers) {
                    ctrl.question.offeredAnswers.sort(function (a, b) {
                        return a.orderNo - b.orderNo;
                    });
                }
            }

            ctrl.save=function(){
                ctrl.formSubmitted=true;
                if(ctrl.form.$valid){
                    ctrl.onReady();
                }

            };



            var questionTypesWithOfferedAnswers = ['radio', 'checkbox', 'select'];

            ctrl.questionTypeChanged = function(){
                if( questionTypesWithOfferedAnswers.indexOf(ctrl.question.type) !== -1){
                    if(!ctrl.question.offeredAnswers){
                        ctrl.question.offeredAnswers=[];
                    }

                }
                if(ctrl.question.type != 'radio'){
                    clearCustomPageFlow();
                    $timeout(function(){
                        ctrl.question.pageFlowModifier=false;
                    });

                }
                if( questionTypesWithOfferedAnswers.indexOf(ctrl.question.type) === -1){
                    delete ctrl.question.offeredAnswers;
                }
                if(ctrl.question.type != 'grid'){
                    delete ctrl.question.grid;
                }

                if(ctrl.question.type != 'priority'){
                    delete ctrl.question.priorityList;
                }


            };

            function clearCustomPageFlow() {

                if(!ctrl.question.offeredAnswers){
                    return;
                }

                ctrl.question.offeredAnswers.forEach(function (answer) {
                    if(ctrl.question.pageFlowModifier){
                        answer.pageFlow = ctrl.possiblePageFlow[0];
                    }else{
                        delete answer.pageFlow;
                    }

                });
            }

            ctrl.pageFlowModifierChanged = function(){
                clearCustomPageFlow();
            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }

        }],
        link: function (scope, ele, attrs, formPageElementBuilder){
            var ctrl = scope.ctrl;
            ctrl.possiblePageFlow = formPageElementBuilder.possiblePageFlow;
            ctrl.options = formPageElementBuilder.options;
        }
    };
});


angular.module('mwFormBuilder').factory("FormParagraphBuilderId", function(){
    var id = 0;
        return {
            next: function(){
                return ++id;
            }
        }
    })

    .directive('mwFormParagraphBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormPageElementBuilder',
        scope: {
            paragraph: '=',
            formObject: '=',
            onReady: '&',
            isPreview: '=?',
            readOnly: '=?'
        },
        // templateUrl: 'mw-form-paragraph-builder.html',
        template: '<div class=mw-form-paragraph-builder-wrapper><div class=mw-form-paragraph-builder ng-class="{\'ng-submitted\':ctrl.formSubmitted}"><div class=paragraph-editor ng-form=ctrl.form ng-if=!ctrl.isPreview><textarea msd-elastic class="form-control mw-form-paragraph-textarea" ng-model=ctrl.paragraph.html required ng-attr-id=paragraph-textarea-{{ctrl.id}} ng-readonly=ctrl.readOnly ng-attr-placeholder="{{\'mwForm.paragraph.placeholder\'|translate}}"></textarea><div class=row><br><div class=col-xs-2><button type=button class="btn btn-primary" ng-click=ctrl.save() translate=mwForm.buttons.questionReady>Gotowe</button></div></div></div><div class=mw-preview ng-if=ctrl.isPreview><p ng-bind-html=ctrl.paragraph.html></p></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["$timeout", "FormParagraphBuilderId", function($timeout,FormParagraphBuilderId){
            var ctrl = this;

            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                ctrl.id = FormParagraphBuilderId.next();
                ctrl.formSubmitted=false;
            };

            ctrl.save=function(){
                ctrl.formSubmitted=true;
                if(ctrl.form.$valid){
                    ctrl.onReady();
                }
            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }

        }],
        link: function (scope, ele, attrs, formPageElementBuilder){
            var ctrl = scope.ctrl;
        }
    };
});


angular.module('mwFormBuilder').directive('mwFormPageElementBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormPageBuilder',
        scope: {
            pageElement: '=',
            formObject: '=',
            isActive: '=',
            isFirst: '=',
            isLast: '=',
            onReady: '&',
            readOnly: '=?'
        },
        // templateUrl: 'mw-form-page-element-builder.html',
        template: '<div class=mw-form-page-element-builder-wrapper><div class=mw-form-page-element-builder ng-class="{\'active\': ctrl.isActive, \'inactive draggable\': !ctrl.isActive}"><div class=mw-page-element-actions-tab ng-switch=ctrl.isActive&&!ctrl.readOnly><span class=mw-additional-buttons><button type=button ng-click=ctrl.callback($event,button) ng-attr-title="{{button.title | translate}}" ng-class=button.cssClass class=edit-button aria-label="{{button.title | translate}}" aria-hidden=false ng-if="ctrl.filter(button) && !ctrl.readOnly" ng-repeat="button in ctrl.options.elementButtons" uib-popover="{{button.title | translate}}" popover-trigger=mouseenter popover-append-to-body popover-placement=right><i class={{button.icon}}></i> {{button.text}}</button></span> <span ng-switch-when=true><button type=button class=move-down-button ng-click=ctrl.moveDown() ng-if=!ctrl.isLast ng-attr-title="{{\'mwForm.buttons.moveDown\' | translate}}" uib-popover="{{\'mwForm.buttons.moveDown\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-down"></i></button> <button type=button class=move-up-button ng-click=ctrl.moveUp() ng-if=!ctrl.isFirst ng-attr-title="{{\'mwForm.buttons.moveUp\' | translate}}" uib-popover="{{\'mwForm.buttons.moveUp\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-up"></i></button> <button type=button class=remove-button mw-confirm-click confirmed-action=ctrl.removeElement() ng-attr-title="{{\'mwForm.buttons.remove\' | translate}}" uib-popover="{{\'mwForm.buttons.remove\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-trash"></i></button></span> <span ng-switch-when=false><button type=button aria-label="{{\'mwForm.buttons.clone\' | translate}}" aria-hidden=false class=edit-button ng-click=ctrl.cloneElement($event) ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.clone\' | translate}}" uib-popover="{{\'mwForm.buttons.clone\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-clone"></i></button> <button type=button aria-label="{{\'mwForm.buttons.edit\' | translate}}" aria-hidden=false class=edit-button ng-click=ctrl.editElement() ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.edit\' | translate}}" uib-popover="{{\'mwForm.buttons.edit\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-pencil"></i></button> <button type=button aria-label="{{\'mwForm.buttons.view\' | translate}}" aria-hidden=false class=edit-button ng-click=ctrl.editElement() ng-if=ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.view\' | translate}}" uib-popover="{{\'mwForm.buttons.view\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-eye"></i></button></span></div><div ng-switch=ctrl.pageElement.type><mw-form-question-builder ng-switch-when=question question=ctrl.pageElement.question form-object=ctrl.formObject on-ready=ctrl.onReady() is-preview=!ctrl.isActive read-only=ctrl.readOnly></mw-form-question-builder><mw-form-image-builder ng-switch-when=image image=ctrl.pageElement.image form-object=ctrl.formObject on-ready=ctrl.onReady() is-preview=!ctrl.isActive read-only=ctrl.readOnly on-image-selection=ctrl.onImageSelection()></mw-form-image-builder><mw-form-paragraph-builder ng-switch-when=paragraph paragraph=ctrl.pageElement.paragraph form-object=ctrl.formObject on-ready=ctrl.onReady() is-preview=!ctrl.isActive read-only=ctrl.readOnly></mw-form-paragraph-builder></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", function(mwFormUuid){
            var ctrl = this;

            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                if(ctrl.pageElement.type=='question'){
                    if(!ctrl.pageElement.question){
                        ctrl.pageElement.question={
                            id: mwFormUuid.get(),
                            text: null,
                            type:null,
                            required:true
                        };
                    }
                }else if(ctrl.pageElement.type=='image'){
                    if(!ctrl.pageElement.image){
                        ctrl.pageElement.image={
                            id: mwFormUuid.get(),
                            align: 'left'
                        };
                    }

                }else if(ctrl.pageElement.type=='paragraph'){
                    if(!ctrl.pageElement.paragraph){
                        ctrl.pageElement.paragraph={
                            id: mwFormUuid.get(),
                            html: ''
                        };
                    }
                }
            };

            ctrl.callback = function($event,element){
                $event.preventDefault();
                $event.stopPropagation();
                if (element.callback && typeof element.callback === "function") {
                    element.callback(ctrl.pageElement);
                }
            };
            ctrl.filter = function(button){
                if(!button.showInOpen && ctrl.isActive){
                    return false;
                }
                if(!button.showInPreview && !ctrl.isActive){
                    return false;
                }

                if (button.filter && typeof button.filter === "function") {
                    return button.filter(ctrl.pageElement);
                }
                return true;
            };

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }
        }],
        link: function (scope, ele, attrs, pageBuilderCtrl){
            var ctrl = scope.ctrl;
            ctrl.possiblePageFlow = pageBuilderCtrl.possiblePageFlow;

            ctrl.hoverIn = function(){
                ctrl.isHovered = true;
            };

            ctrl.hoverOut = function(){
                ctrl.isHovered = false;
            };

            ctrl.editElement=function(){
                pageBuilderCtrl.selectElement(ctrl.pageElement);
            };

            ctrl.cloneElement=function($event){
                $event.preventDefault();
                $event.stopPropagation();
                pageBuilderCtrl.cloneElement(ctrl.pageElement);
            };

            ctrl.removeElement=function(){
                pageBuilderCtrl.removeElement(ctrl.pageElement);
            };

            ctrl.moveDown= function(){
                pageBuilderCtrl.moveDownElement(ctrl.pageElement);
            };
            ctrl.moveUp= function(){
                pageBuilderCtrl.moveUpElement(ctrl.pageElement);
            };

            ctrl.options = pageBuilderCtrl.options;
            ctrl.onImageSelection = pageBuilderCtrl.onImageSelection;
        }
    };
});


angular.module('mwFormBuilder').directive('mwFormPageBuilder', ["$rootScope", function ($rootScope) {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormBuilder',
        scope: {
            formPage: '=',
            formObject: '=',
            isFirst: '=',
            isLast: '=',
            readOnly: '=?'
        },
        // templateUrl: 'mw-form-page-builder.html',
        template: '<div class=mw-form-page-builder ng-class="{\'page-folded\': ctrl.isFolded}"><div ng-mouseover=ctrl.hoverIn() ng-mouseleave=ctrl.hoverOut()><div class=mw-page-tab-container><div class=mw-page-tab-actions ng-switch=ctrl.readOnly><button type=button class=fold-button ng-click=ctrl.fold() ng-attr-title="{{\'mwForm.buttons.fold\' | translate}}" uib-popover="{{\'mwForm.buttons.fold\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-compress"></i></button> <button type=button class=unfold-button ng-click=ctrl.unfold() ng-attr-title="{{\'mwForm.buttons.unfold\' | translate}}" uib-popover="{{\'mwForm.buttons.unfold\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-expand"></i></button> <button type=button class=move-down-button ng-click=ctrl.moveDown() ng-if=!ctrl.isLast ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.moveDown\' | translate}}" uib-popover="{{\'mwForm.buttons.moveDown\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-down"></i></button> <button type=button class=move-up-button ng-click=ctrl.moveUp() ng-if=!ctrl.isFirst ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.moveUp\' | translate}}" uib-popover="{{\'mwForm.buttons.moveUp\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-up"></i></button> <button type=button class=remove-button mw-confirm-click confirmed-action=ctrl.removePage() ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.removePage\' | translate}}" uib-popover="{{\'mwForm.buttons.removePage\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-trash"></i></button></div></div><div ng-form=ctrl.form role=form novalidate class=form-page-builder-body><div class=form-group ng-if=ctrl.formPage.namedPage><label ng-attr-for=page-name-{{ctrl.formPage.number}} translate=mwForm.page.name>Nazwa strony</label> <input type=text class=form-control name=pageName ng-attr-id=page-name-{{ctrl.formPage.number}} ng-blur=ctrl.pageNameChanged() ng-model=ctrl.formPage.name ng-readonly=ctrl.readOnly></div><div class=page-element-list ng-sortable=ctrl.sortableConfig ng-model=ctrl.formPage.elements><div class="empty-page-element-list-label form-group" ng-if="!ctrl.formPage.elements || (ctrl.formPage.elements && ctrl.formPage.elements.length === 0)"><span translate=mwForm.page.elements.empty>Brak elementów</span></div><mw-form-page-element-builder ng-repeat="element in ctrl.formPage.elements" page-element=element form-object=ctrl.formObject is-active=ctrl.isElementActive(element) on-ready=ctrl.onElementReady() ng-click=ctrl.selectElement(element) is-first=$first is-last=$last read-only=ctrl.readOnly></mw-form-page-element-builder></div><div uib-dropdown class="add-element btn-group" ng-if=!ctrl.readOnly><button type=button class="btn btn-primary" ng-click=ctrl.addElement()><span translate=mwForm.buttons.addElement>Add element</span></button> <button type=button class="btn btn-primary" uib-dropdown-toggle aria-haspopup=true aria-expanded=false><span class=caret></span> <span class=sr-only>Split button!</span></button><ul uib-dropdown-menu aria-labelledby=simple-dropdown role=menu><li ng-if="ctrl.isElementTypeEnabled(\'question\')"><button type=button ng-click=ctrl.addQuestion()><span translate=mwForm.elements.question>Pytanie</span><i class="fa fa-question-circle fa-lg fa-fw" style="margin-left: 10px;"></i></button></li><li ng-if="ctrl.isElementTypeEnabled(\'image\')"><button type=button ng-click=ctrl.addImage()><span translate=mwForm.elements.image>Obraz</span><i class="fa fa-picture-o fa-lg fa-fw" style="margin-left: 10px;"></i></button></li><li ng-if="ctrl.isElementTypeEnabled(\'paragraph\')"><button type=button ng-click=ctrl.addParagraph()><span translate=mwForm.elements.paragraph>Obraz</span><i class="fa fa-paragraph fa-lg fa-fw" style="margin-left: 10px;"></i></button></li></ul></div></div><table cellspacing=0 class=mw-page-bottom-tab-container ng-if=!ctrl.isLast><tr><td class=mw-page-bottom-tab-triangle></td><td class=mw-form-page-bottom-tab><div class="page-flow-select form-inline"><label translate=mwForm.pageFlow.afterPage translate-values={page:ctrl.formPage.number} ng-attr-for=page-flow-select-{{ctrl.formPage.number}}>Po stronie 1</label><select ng-attr-id=page-flow-select-{{ctrl.formPage.number}} ng-options="pageFlow.label|translate:pageFlow for pageFlow in ctrl.possiblePageFlow" ng-model=ctrl.formPage.pageFlow class=form-control ng-disabled=ctrl.readOnly></select></div></td><td class=mw-page-bottom-tab-actions><button type=button role=button class=btn ng-click=ctrl.addPage() ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.addPage\' | translate}}" uib-popover="{{\'mwForm.buttons.addPage\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-plus"></i></button></td></tr></table></div></div>',
        // template: '<div class=mw-form-page-builder ng-class="{\'page-folded\': ctrl.isFolded}"><div ng-mouseover=ctrl.hoverIn() ng-mouseleave=ctrl.hoverOut()><div class=mw-page-tab-container><div class=mw-form-page-tab><span class=mw-page-tab-text role=heading translate=mwForm.page.tab.heading translate-values="{page: ctrl.formPage.number, allPages:ctrl.formObject.pages.length}">Strona 1 z 3</span> </div><div class=mw-page-tab-triangle></div><div class=mw-page-tab-actions ng-switch=ctrl.readOnly><button type=button class=fold-button ng-click=ctrl.fold() ng-attr-title="{{\'mwForm.buttons.fold\' | translate}}" uib-popover="{{\'mwForm.buttons.fold\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-compress"></i></button> <button type=button class=unfold-button ng-click=ctrl.unfold() ng-attr-title="{{\'mwForm.buttons.unfold\' | translate}}" uib-popover="{{\'mwForm.buttons.unfold\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-expand"></i></button> <button type=button class=move-down-button ng-click=ctrl.moveDown() ng-if=!ctrl.isLast ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.moveDown\' | translate}}" uib-popover="{{\'mwForm.buttons.moveDown\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-down"></i></button> <button type=button class=move-up-button ng-click=ctrl.moveUp() ng-if=!ctrl.isFirst ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.moveUp\' | translate}}" uib-popover="{{\'mwForm.buttons.moveUp\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-chevron-up"></i></button> <button type=button class=remove-button mw-confirm-click confirmed-action=ctrl.removePage() ng-switch-when=false ng-attr-title="{{\'mwForm.buttons.removePage\' | translate}}" uib-popover="{{\'mwForm.buttons.removePage\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-trash"></i></button></div></div><div ng-form=ctrl.form role=form novalidate class=form-page-builder-body><div class=form-group ng-if="true"><label ng-attr-for=page-name-{{ctrl.formPage.number}} translate=mwForm.page.name>Nazwa strony</label> <input type=text class=form-control name=pageName ng-attr-id=page-name-{{ctrl.formPage.number}} ng-blur=ctrl.pageNameChanged() ng-model=ctrl.formPage.name ng-readonly=ctrl.readOnly required></div><div class=page-element-list ng-sortable=ctrl.sortableConfig ng-model=ctrl.formPage.elements><div class="empty-page-element-list-label form-group" ng-if="!ctrl.formPage.elements || (ctrl.formPage.elements && ctrl.formPage.elements.length === 0)"><span translate=mwForm.page.elements.empty>Brak elementów</span></div><mw-form-page-element-builder ng-repeat="element in ctrl.formPage.elements" page-element=element form-object=ctrl.formObject is-active=ctrl.isElementActive(element) on-ready=ctrl.onElementReady() ng-click=ctrl.selectElement(element) is-first=$first is-last=$last read-only=ctrl.readOnly></mw-form-page-element-builder></div><div uib-dropdown class="add-element btn-group" ng-if=!ctrl.readOnly><button type=button class="btn btn-default" ng-click=ctrl.addElement()><span translate=mwForm.buttons.addElement>Add element</span></button> <button type=button class="btn btn-default" uib-dropdown-toggle aria-haspopup=true aria-expanded=false><span class=caret></span> <span class=sr-only>Split button!</span></button><ul uib-dropdown-menu aria-labelledby=simple-dropdown role=menu><li ng-if="ctrl.isElementTypeEnabled(\'question\')"><button type=button ng-click=ctrl.addQuestion()><span translate=mwForm.elements.question>Pytanie</span><i class="fa fa-question-circle fa-lg fa-fw" style="margin-left: 10px;"></i></button></li><li ng-if="ctrl.isElementTypeEnabled(\'image\')"><button type=button ng-click=ctrl.addImage()><span translate=mwForm.elements.image>Obraz</span><i class="fa fa-picture-o fa-lg fa-fw" style="margin-left: 10px;"></i></button></li><li ng-if="ctrl.isElementTypeEnabled(\'paragraph\')"><button type=button ng-click=ctrl.addParagraph()><span translate=mwForm.elements.paragraph>Obraz</span><i class="fa fa-paragraph fa-lg fa-fw" style="margin-left: 10px;"></i></button></li></ul></div></div><table cellspacing=0 class=mw-page-bottom-tab-container ng-if=!ctrl.isLast><tr><td class=mw-page-bottom-tab-triangle></td><td class=mw-form-page-bottom-tab><div class="page-flow-select form-inline"><label translate=mwForm.pageFlow.afterPage translate-values={page:ctrl.formPage.number} ng-attr-for=page-flow-select-{{ctrl.formPage.number}}>Po stronie 1</label><select ng-attr-id=page-flow-select-{{ctrl.formPage.number}} ng-options="pageFlow.label|translate:pageFlow for pageFlow in ctrl.possiblePageFlow" ng-model=ctrl.formPage.pageFlow class=form-control ng-disabled=ctrl.readOnly></select></div></td><td class=mw-page-bottom-tab-actions><button type=button role=button class=btn ng-click=ctrl.addPage() ng-if=!ctrl.readOnly ng-attr-title="{{\'mwForm.buttons.addPage\' | translate}}" uib-popover="{{\'mwForm.buttons.addPage\' | translate}}" popover-trigger=mouseenter popover-placement=top><i class="fa fa-plus"></i></button></td></tr></table></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["$timeout", "mwFormUuid", "mwFormClone", "mwFormBuilderOptions", function($timeout, mwFormUuid, mwFormClone, mwFormBuilderOptions){
            var ctrl = this;
            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                ctrl.hoverEdit = false;
                ctrl.formPage.namedPage = !!ctrl.formPage.name;
                ctrl.isFolded = false;
                sortElementsByOrderNo();

                ctrl.sortableConfig = {
                    disabled: ctrl.readOnly,
                    ghostClass: "beingDragged",
                    group: "survey",
                    handle: ".inactive",
                    //cancel: ".not-draggable",
                    chosenClass: ".page-element-list",
                    onEnd: function(e, ui) {
                        updateElementsOrderNo();
                    }
                };

                ctrl.activeElement = null;
            };

            ctrl.unfold = function(){
                ctrl.isFolded = false;
            };
            ctrl.fold = function(){
                ctrl.isFolded = true;
            };


            function updateElementsOrderNo() {
                for(var i=0; i<ctrl.formPage.elements.length; i++){
                    ctrl.formPage.elements[i].orderNo = i+1;
                }
            }


            function sortElementsByOrderNo() {
                ctrl.formPage.elements.sort(function(a,b){
                    return a.orderNo - b.orderNo;
                });
            }
            ctrl.pageNameChanged = function(){
                $rootScope.$broadcast('mwForm.pageEvents.pageNameChanged', {page: ctrl.formPage});
            };



            ctrl.addElement = function(type){
                if(!type){

                    type=mwFormBuilderOptions.elementTypes[0];
                }
                var element = createEmptyElement(type, ctrl.formPage.elements.length + 1);
                ctrl.activeElement=element;
                ctrl.formPage.elements.push(element);
            };

            ctrl.cloneElement = function(pageElement, setActive){
                var index = ctrl.formPage.elements.indexOf(pageElement);
                var element = mwFormClone.cloneElement(pageElement);
                if(setActive){
                    ctrl.activeElement=element;
                }
                ctrl.formPage.elements.splice(index,0, element);

            };

            ctrl.removeElement = function(pageElement){
                var index = ctrl.formPage.elements.indexOf(pageElement);
                ctrl.formPage.elements.splice(index,1);
            };

            ctrl.moveDownElement= function(pageElement){
                var fromIndex = ctrl.formPage.elements.indexOf(pageElement);
                var toIndex=fromIndex+1;
                if(toIndex<ctrl.formPage.elements.length){
                    arrayMove(ctrl.formPage.elements, fromIndex, toIndex);
                }
                updateElementsOrderNo();
            };

            ctrl.moveUpElement= function(pageElement){
                var fromIndex = ctrl.formPage.elements.indexOf(pageElement);
                var toIndex=fromIndex-1;
                if(toIndex>=0){
                    arrayMove(ctrl.formPage.elements, fromIndex, toIndex);
                }
                updateElementsOrderNo();
            };

            ctrl.isElementTypeEnabled = function(elementType){
                return mwFormBuilderOptions.elementTypes.indexOf(elementType) !== -1;
            };

            ctrl.addQuestion = function(){
                ctrl.addElement('question');
            };

            ctrl.addImage = function(){
                ctrl.addElement('image');
            };

            ctrl.addParagraph= function(){
                ctrl.addElement('paragraph');
            };

            ctrl.isElementActive= function(element){
                return ctrl.activeElement==element;
            };

            ctrl.selectElement = function(element){
                ctrl.activeElement=element;
            };

            ctrl.onElementReady = function(){
                $timeout(function(){
                    ctrl.activeElement=null;
                });
            };

            function createEmptyElement(type,orderNo){
                return {
                    id: mwFormUuid.get(),
                    orderNo: orderNo,
                    type: type
                };
            }

            function arrayMove(arr, fromIndex, toIndex) {
                var element = arr[fromIndex];
                arr.splice(fromIndex, 1);
                arr.splice(toIndex, 0, element);
            }

            ctrl.hoverIn = function(){
                ctrl.hoverEdit = true;
            };

            ctrl.hoverOut = function(){
                ctrl.hoverEdit = false;
            };


            ctrl.updateElementsOrderNo = updateElementsOrderNo;

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }

        }],
        link: function (scope, ele, attrs, formBuilderCtrl){
            var ctrl = scope.ctrl;
            ctrl.possiblePageFlow = formBuilderCtrl.possiblePageFlow;
            ctrl.moveDown= function(){

                formBuilderCtrl.moveDownPage(ctrl.formPage);
            };

            ctrl.moveUp= function(){
                formBuilderCtrl.moveUpPage(ctrl.formPage);
            };

            ctrl.removePage=function(){
                formBuilderCtrl.removePage(ctrl.formPage);
            };

            ctrl.addPage=function(){
                formBuilderCtrl.addPageAfter(ctrl.formPage);
            };

            scope.$watch('ctrl.formPage.elements.length', function(newValue, oldValue){
                if(newValue!=oldValue){
                    ctrl.updateElementsOrderNo();
                }
            });
            ctrl.options = formBuilderCtrl.options;
            ctrl.onImageSelection = formBuilderCtrl.onImageSelection;
        }
    };
}]);


angular.module('mwFormBuilder').factory("FormImageBuilderId", function(){
    var id = 0;
        return {
            next: function(){
                return ++id;
            }
        }
    })

    .directive('mwFormImageBuilder', function () {

    return {
        replace: true,
        restrict: 'AE',
        require: '^mwFormPageElementBuilder',
        scope: {
            image: '=',
            formObject: '=',
            onReady: '&',
            isPreview: '=?',
            readOnly: '=?',
            onImageSelection: '&'
        },
        // templateUrl: 'mw-form-image-builder.html',
        template: '<div class=mw-form-image-builder-wrapper><div class=mw-form-image-builder ng-class="{\'ng-submitted\':ctrl.formSubmitted}"><div class=image-editor ng-form=ctrl.form ng-if=!ctrl.isPreview><button ng-if=!ctrl.image.src ng-click=ctrl.selectImageButtonClicked() type=button class="btn btn-default" translate=mwForm.image.selectImageButton>Select image</button><div class="image-edition row" ng-if=ctrl.image.src><div class=col-md-12 ng-class="\'align-\'+ctrl.image.align"><img ng-src={{ctrl.image.src}}></div><div class="col-md-12 image-align-control"><div class=btn-group role=group aria-label="Image align"><button type=button class="btn btn-default" ng-class="{\'selected\': ctrl.image.align==\'left\'}" ng-click="ctrl.setAlign(\'left\')"><i class="fa fa-align-left"></i></button> <button type=button class="btn btn-default" ng-class="{\'selected\': ctrl.image.align==\'center\'}" ng-click="ctrl.setAlign(\'center\')"><i class="fa fa-align-center"></i></button> <button type=button class="btn btn-default" ng-class="{\'selected\': ctrl.image.align==\'right\'}" ng-click="ctrl.setAlign(\'right\')"><i class="fa fa-align-right"></i></button></div></div><div class=form-horizontal><div class=form-group><label ng-attr-for=image-caption-{{ctrl.id}} class="col-sm-2 control-label">Podpis</label><div class=col-sm-8><input type=text class=form-control name=text ng-attr-id=image-caption-{{ctrl.id}} ng-model=ctrl.image.caption ng-readonly=ctrl.readOnly></div></div></div></div><div class=row ng-if=ctrl.image.src><br><br><div class=col-xs-2><button type=button class="btn btn-primary" ng-click=ctrl.save() translate=mwForm.buttons.questionReady>Gotowe</button></div></div></div><div class=mw-preview ng-if=ctrl.isPreview><figure ng-class="\'align-\'+ctrl.image.align"><img ng-src={{ctrl.image.src}} ng-attr-alt=ctrl.image.caption><figcaption ng-if=ctrl.image.caption>{{ctrl.image.caption}}</figcaption></figure></div></div></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["$timeout", "FormImageBuilderId", "mwFormUuid", function($timeout,FormImageBuilderId, mwFormUuid){
            var ctrl = this;
            ctrl.id = FormImageBuilderId.next();
            ctrl.formSubmitted=false;

            ctrl.save=function(){
                ctrl.formSubmitted=true;
                if(ctrl.form.$valid){
                    ctrl.onReady();
                }
            };

            ctrl.selectImageButtonClicked = function(){
                var resultPromise = ctrl.onImageSelection();
                resultPromise.then(function(imageSrc){
                   ctrl.image.src = imageSrc;

                }).catch(function(){

                });
            };

            ctrl.setAlign = function(align){
                ctrl.image.align = align;
            }


        }],
        link: function (scope, ele, attrs, formPageElementBuilder){
            var ctrl = scope.ctrl;
        }
    };
});

// angular.module('mwFormBuilder').directive('mwFormConfirmationPageBuilder', function () {

//     return {
//         replace: true,
//         restrict: 'AE',
//         scope: {
//             formObject: '=',
//             readOnly: '=?'
//         },
//         // templateUrl: 'mw-form-confirmation-page-builder.html',
//         template: '<div class="mw-form-page-builder mw-confirmation-page"><div><div class=mw-page-tab-container><div class=mw-form-page-tab><span class=mw-page-tab-text role=heading translate=mwForm.confirmationPage.title>Strona potwierdzenia</span></div><div class=mw-page-tab-triangle></div></div><div ng-form=ctrl.form role=form novalidate class=form-page-builder-body><div class=form-group><textarea msd-elastic class=form-control name=confirmationMessage ng-model=ctrl.formObject.confirmationMessage aria-label="{{\'mwForm.confirmationPage.customMessage\'|translate}}" placeholder="{{\'mwForm.confirmationPage.customMessage\'|translate}}" ng-disabled=ctrl.readOnly></textarea></div></div></div></div>',
//         controllerAs: 'ctrl',
//         bindToController: true,
//         controller: ["$timeout", function($timeout){
//             var ctrl = this;
//             ctrl.hoverEdit = false;


//             ctrl.hoverIn = function(){
//                 ctrl.hoverEdit = true;
//             };

//             ctrl.hoverOut = function(){
//                 ctrl.hoverEdit = false;
//             };

//         }],
//         link: function (scope, ele, attrs){

//         }
//     };
// });


angular.module('mwFormBuilder').directive('mwFormBuilder', ["$rootScope", function ($rootScope) {

    return {
        replace: true,
        restrict: 'AE',
        scope: {
            formData: '=',
            readOnly: '=?',
            options: '=?',
            formStatus: '=?',
            onImageSelection: '&',
            api: '=?'
        },
        // templateUrl: 'mw-form-builder.html',
        // template: '<div class=mw-form-builder><form name=ctrl.form role=form novalidate><div class=mw-title-page><div class=form-group><mw-label label-for=formName label-key=mwForm.form.name></mw-label><input type=text class=form-control name=formName id=formName ng-model=ctrl.formData.name ng-readonly=ctrl.readOnly placeholder="{{\'mwForm.form.name.placeholder\'|translate}}" required></div><div class=form-group><mw-label label-for=formDescription label-key=mwForm.form.description></mw-label><textarea msd-elastic class=form-control name=formDescription ng-model=ctrl.formData.description id=formDescription ng-readonly=ctrl.readOnly>\r\n            </textarea></div></div><div class=form-page-list><mw-form-page-builder ng-repeat="page in ctrl.formData.pages| mwStartFrom:ctrl.currentPage * ctrl.options.pageSize | limitTo:ctrl.options.pageSize" form-page=page form-object=ctrl.formData is-first=$first is-last=$last read-only=ctrl.readOnly></mw-form-page-builder></div><div class=row><div class=col-sm-9><div class=row><div class=col-sm-6><button class="btn btn-default" ng-disabled="ctrl.currentPage === 0" ng-click="ctrl.currentPage = 0"><i class="fa fa-angle-double-left"></i></button> <button class="btn btn-default" ng-disabled="ctrl.currentPage === 0" ng-click="ctrl.currentPage = ctrl.currentPage - 1"><i class="fa fa-angle-left"></i></button> {{ctrl.currentPage + 1}}/{{ctrl.numberOfPages()}} <button class="btn btn-default" ng-disabled="ctrl.currentPage >= ctrl.formData.pages.length / ctrl.options.pageSize - 1" ng-click="ctrl.currentPage = ctrl.currentPage + 1"><i class="fa fa-angle-right"></i></button> <button class="btn btn-default" ng-disabled="ctrl.currentPage >= ctrl.formData.pages.length / ctrl.options.pageSize - 1" ng-click=ctrl.lastPage()><i class="fa fa-angle-double-right"></i></button></div><div class=col-sm-2><select ng-change=ctrl.onChangePageSize() class=form-control ng-model=ctrl.options.pageSize ng-options="item for item in ctrl.options.pagesSize"></select></div></div></div><div class=col-sm-3><div class=row><div class="col-sm-12 text-right"><button type=button class="btn btn-default mw-add-new-page-button" ng-click=ctrl.addPage() ng-if=!ctrl.readOnly><i class="fa fa-plus"></i> <span translate=mwForm.buttons.addPage></span></button></div></div></div></div><mw-form-confirmation-page-builder form-object=ctrl.formData read-only=ctrl.readOnly></mw-form-confirmation-page-builder></form></div>',
        template: '<div class=mw-form-builder><form name=ctrl.form role=form novalidate><div class=mw-title-page><div class=form-group><mw-label label-for=formName label-key=mwForm.form.name></mw-label><input type=text class=form-control name=formName id=formName ng-model=ctrl.formData.name ng-readonly=ctrl.readOnly placeholder="{{\'mwForm.form.name.placeholder\'|translate}}" required></div><div class=form-group><mw-label label-for=formDescription label-key=mwForm.form.description></mw-label><textarea msd-elastic class=form-control name=formDescription ng-model=ctrl.formData.description id=formDescription ng-readonly=ctrl.readOnly>\r\n            </textarea></div></div><div class=form-page-list><mw-form-page-builder ng-repeat="page in ctrl.formData.pages| mwStartFrom:ctrl.currentPage * ctrl.options.pageSize | limitTo:ctrl.options.pageSize" form-page=page form-object=ctrl.formData is-first=$first is-last=$last read-only=ctrl.readOnly></mw-form-page-builder></div><mw-form-confirmation-page-builder form-object=ctrl.formData read-only=ctrl.readOnly></mw-form-confirmation-page-builder></form></div>',
        controllerAs: 'ctrl',
        bindToController: true,
        controller: ["mwFormUuid", "MW_QUESTION_TYPES", "mwFormBuilderOptions", function(mwFormUuid, MW_QUESTION_TYPES, mwFormBuilderOptions){
            var ctrl = this;
            // Put initialization logic inside `$onInit()`
            // to make sure bindings have been initialized.
            ctrl.$onInit = function() {
                ctrl.currentPage = 0;

                if(!ctrl.formData.pages || !ctrl.formData.pages.length){
                    ctrl.formData.pages = [];
                    ctrl.formData.pages.push(createEmptyPage(1));
                }

                ctrl.options = mwFormBuilderOptions.$init(ctrl.options);

                if(ctrl.api){
                    ctrl.api.reset = function(){
                        for (var prop in ctrl.formData) {
                            if (ctrl.formData.hasOwnProperty(prop) && prop != 'pages') {
                                delete ctrl.formData[prop];
                            }
                        }

                        ctrl.formData.pages.length=0;
                        ctrl.formData.pages.push(createEmptyPage(1));

                    }
                }
            };


            ctrl.numberOfPages=function(){
                return Math.ceil(ctrl.formData.pages.length/ctrl.options.pageSize);
            };
            ctrl.lastPage = function(){
               ctrl.currentPage = Math.ceil(ctrl.formData.pages.length/ctrl.options.pageSize - 1);
            };
            ctrl.addPage = function(){
                ctrl.formData.pages.push(createEmptyPage(ctrl.formData.pages.length+1));
                ctrl.lastPage();
                $rootScope.$broadcast("mwForm.pageEvents.pageAdded");
            };
            ctrl.onChangePageSize = function(){
                if(ctrl.currentPage > Math.ceil(ctrl.formData.pages.length/ctrl.options.pageSize - 1)){
                   ctrl.currentPage = Math.ceil(ctrl.formData.pages.length/ctrl.options.pageSize - 1);
                }
            };


            function createEmptyPage(number){
                var defaultPageFlow = null;
                if(ctrl.possiblePageFlow){
                    defaultPageFlow = ctrl.possiblePageFlow[0];
                }

                return {
                    id: mwFormUuid.get(),
                    number: number,
                    name: null,
                    description: null,
                    pageFlow: defaultPageFlow,
                    elements: []
                };
            }

            function updatePageNumbers() {
                for(var i=0; i<ctrl.formData.pages.length; i++){
                    ctrl.formData.pages[i].number = i+1;
                }
                ctrl.updatePageFlow();
            }

            ctrl.addPageAfter=function(page){
                var index = ctrl.formData.pages.indexOf(page);
                var newIndex = index+1;
                var newPage = createEmptyPage(page.number+1);
                if(newIndex<ctrl.formData.pages.length){
                    ctrl.formData.pages.splice(newIndex,0, newPage);
                }else{
                    ctrl.formData.pages.push(newPage);
                }
                updatePageNumbers();
                $rootScope.$broadcast("mwForm.pageEvents.pageAdded");

            };

            ctrl.moveDownPage= function(page){
                var fromIndex = ctrl.formData.pages.indexOf(page);
                var toIndex=fromIndex+1;
                if(toIndex<ctrl.formData.pages.length){
                    arrayMove(ctrl.formData.pages, fromIndex, toIndex);
                }
                updatePageNumbers();
                $rootScope.$broadcast("mwForm.pageEvents.pageMoved");

            };

            ctrl.moveUpPage= function(page){
                var fromIndex = ctrl.formData.pages.indexOf(page);
                var toIndex=fromIndex-1;
                if(toIndex>=0){
                    arrayMove(ctrl.formData.pages, fromIndex, toIndex);
                }
                updatePageNumbers();
                $rootScope.$broadcast("mwForm.pageEvents.pageMoved");

            };

            ctrl.removePage=function(page){
                var index = ctrl.formData.pages.indexOf(page);
                ctrl.formData.pages.splice(index,1);
                updatePageNumbers();
                $rootScope.$broadcast("mwForm.pageEvents.pageRemoved");
                ctrl.onChangePageSize();
            };

            function arrayMove(arr, fromIndex, toIndex) {
                var element = arr[fromIndex];
                arr.splice(fromIndex, 1);
                arr.splice(toIndex, 0, element);
            }

            // Prior to v1.5, we need to call `$onInit()` manually.
            // (Bindings will always be pre-assigned in these versions.)
            if (angular.version.major === 1 && angular.version.minor < 5) {
                ctrl.$onInit();
            }

        }],
        link: function (scope, ele, attrs){
            var ctrl = scope.ctrl;
            if(ctrl.formStatus){
                ctrl.formStatus.form = ctrl.form;
            }

            ctrl.possiblePageFlow = [];
            var defaultPageFlow = {
                nextPage: true,
                label: 'mwForm.pageFlow.goToNextPage'
            };
            ctrl.possiblePageFlow.push(defaultPageFlow);
            ctrl.isSamePageFlow = function (p1, p2){
                return (p1.page && p2.page &&  p1.page.id==p2.page.id) || p1.formSubmit && p2.formSubmit || p1.nextPage && p2.nextPage;
            };

            ctrl.updatePageFlow = function(){
                ctrl.possiblePageFlow.length=1;

                ctrl.formData.pages.forEach(function(page){

                    ctrl.possiblePageFlow.push({
                        page:{
                            id: page.id,
                            number: page.number
                        },
                        label: 'mwForm.pageFlow.goToPage'
                    });
                });

                ctrl.possiblePageFlow.push({
                    formSubmit:true,
                    label: 'mwForm.pageFlow.submitForm'
                });
                ctrl.formData.pages.forEach(function(page){
                    ctrl.possiblePageFlow.forEach(function(pageFlow){
                        if(page.pageFlow) {
                            if(ctrl.isSamePageFlow(pageFlow, page.pageFlow)){
                                page.pageFlow = pageFlow;
                            }
                        }else{
                            page.pageFlow = defaultPageFlow;
                        }

                        page.elements.forEach(function(element){
                            var question = element.question;
                            if(question && question.pageFlowModifier){
                                question.offeredAnswers.forEach(function(answer){
                                    if(answer.pageFlow){
                                        if(ctrl.isSamePageFlow(pageFlow, answer.pageFlow)){
                                            answer.pageFlow = pageFlow;
                                        }
                                    }
                                });
                            }

                        });
                    });
                });
            };

            scope.$watch('ctrl.formData.pages.length', function(newVal, oldVal){
                ctrl.updatePageFlow();
            });
            scope.$watch('ctrl.currentPage', function(newVal, oldVal){
                $rootScope.$broadcast("mwForm.pageEvents.pageCurrentChanged",{index:ctrl.currentPage});
            });
            scope.$on('mwForm.pageEvents.changePage', function(event,data){
                if(typeof data.page !== "undefined" && data.page < ctrl.numberOfPages()){
                   ctrl.currentPage = data.page;
                }
            });
            scope.$on('mwForm.pageEvents.addPage', function(event,data){
                ctrl.addPage();
            });
        }
    };
}]);


angular.module('mwFormBuilder').filter('mwStartFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    };
});
angular.module('mwFormBuilder')
    .constant('MW_QUESTION_TYPES', ['text', 'textarea', 'radio', 'checkbox', 'select', 'grid', 'priority', 'division', 'number', 'date', 'time', 'email', 'range', 'url'])
    .constant('MW_ELEMENT_TYPES', ['question', 'image', 'paragraph'])
    .constant('MW_GRID_CELL_INPUT_TYPES', ['radio', 'checkbox', 'text', 'number', 'date', 'time'])
    .factory('mwFormBuilderOptions', ["MW_ELEMENT_TYPES", "MW_QUESTION_TYPES", function mwFormBuilderOptionsFactory(MW_ELEMENT_TYPES, MW_QUESTION_TYPES){

        var defaultElementButtonOptions={
            title: null,
            icon: null,
            text: null,
            callback: null,
            filter: null,
            showInOpen:false,
            showInPreview:true,
            cssClass: ''
        };

        var defaultCustomQuestionSelectOptions={
            key: null,
            label: null,
            selects: [],
            required: true
        };

        var defaultOptions={
            elementTypes: MW_ELEMENT_TYPES,
            questionTypes: MW_QUESTION_TYPES,
            elementButtons: [],
            pagesSize: [10,25,50,100],
            pageSize: 10,
            customQuestionSelects: [],
            customElements: [] //TODO
        };

        function extendOptionList(optionList, defaultItemOptions){
            if(!optionList){
                return [];
            }
            return optionList.map(function (itemOptions){
                return angular.extend({}, defaultItemOptions, itemOptions);
            });
        }

        var options = {

            $init: function(customOptions){
                angular.extend(options, defaultOptions, customOptions);
                options.customQuestionSelects = extendOptionList(options.customQuestionSelects, defaultCustomQuestionSelectOptions);
                options.elementButtons = extendOptionList(options.elementButtons, defaultElementButtonOptions);

                return options;
            }
        };


        return options;
    }]);

angular.module('mwFormBuilder')
    .directive('wdFocusMe', ["$timeout", "$parse", function($timeout, $parse) {
        return {
            link: function(scope, element, attrs) {
                var model = $parse(attrs.wdFocusMe);
                scope.$watch(model, function(value) {
                    if(value === true) {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                });
                element.bind('blur', function() {
                    $timeout(function() {
                        scope.$apply(model.assign(scope, false));
                    });

                });
            }
        };
    }])
    .factory('focus', ["$timeout", "$window", function($timeout, $window) {
        return function(id) {
            $timeout(function() {
                var element = $window.document.getElementById(id);
                if(element)
                    element.focus();
            });
        };
    }]);

'use strict';

angular.module('mwFormBuilder')
    .directive('mwConfirmClick', ["$window", function($window){
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                var msg = attr.wdConfirmClick || "Are you sure?";
                element.bind('click',function (event) {
                    if ( $window.confirm(msg) ) {
                        scope.$apply(attr.confirmedAction);
                    }
                });
            }
        }
    }]);
