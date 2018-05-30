// ## 逻辑思路
// 1. 根据需要设置滚动条的默认配置项
// 2. 计算滑块可移动距离和内容可滚动高度
// 3. 根据鼠标移动距离设置滑块位置和内容滚动高度

// 自调用匿名函数模拟块级作用域，防止与其他变量名等代码冲突
!function (win, doc, $) {
	// 构造函数声明
	function CusScrollBar(options) {
		//初始化滚动条
		this._init(options);
	}
	
	// 在构造函数的原型上添加初始化滚动条方法_init
	$.extend(CusScrollBar.prototype, {
		_init: function (options) {

			// 滚动条的默认配置
			this.options = {
				scrollDir      : "y", 
				contSelector   : ".scroll-cont",
				barSelector    : ".scroll-bar",
				sliderSelector : ".scroll-slider",
				tabItemSelector: ".tab-item",
				tabActiveClass : 'tab-active',
				anchorSelector : '.section-title',
				sectionSelector: '.section-cont',
				wheelStep      : 20
			};

			$.extend(true, this.options, options || {});

			this._initDomRefer()
				._bindDragSliderEvent()
				._bindMouseWheel()
				._bindTabClick()
				.correctSectionHeight();

			return this;
		},
		/**
		 * 获取dom引用
		 * @return {[object]} [返回当前调用对象]
		 */	
		_initDomRefer : function () {
			var opts = this.options;
			this.$doc = $(doc);
			this.$cont = $(opts.contSelector);
			this.$slider = $(opts.sliderSelector);
			this.$bar = opts.barSelector ? $(opts.barSelector) : this.$slider.parent();
			this.$tabItem = $(opts.tabItemSelector);
			this.$anchor = $(opts.anchorSelector);
			this.$sectionCont = $(opts.sectionSelector);

			// 返回this，用于链式调用
			return this;
		},
		/**
		 * [getContMaxScrollHeight 获取滚动内容区最大滚动高度]
		 * @return {[number]} 
		 */
		getContMaxScrollHeight : function () {
			// div.scrollHeight/Width：获取元素内容的完整高度/或宽度
			// $div.height/width()：获取元素的可视高度/宽度
			return Math.max(this.$cont[0].scrollHeight, this.$cont.height()) - this.$cont.height();
		},
		/**
		 * [getSliderMaxMoveHeight 获取滑块最大可移动高度]
		 * @return {[number]}
		 */
		getSliderMaxMoveHeight : function () {
			return this.$bar.height() - this.$slider.height();
		},
		/**
		 * [scrollTo description]
		 * @param  {[number]} contScrollPosition [内容要滚动到的位置]
		 * @return {[null]}
		 */
		scrollTo : function (contScrollPosition) {
			var $cont = this.$cont;
			// 设置内容的scrollTop
			$cont.scrollTop(contScrollPosition);

			// 设置滑块的位置 
			// 用scrollTop()而不用contScrollPosition防止取到负值
			var contScrollTop = $cont.scrollTop();
			var sliderPositionVal = contScrollTop / this.getContMaxScrollHeight() * this.getSliderMaxMoveHeight();
			var sliderTop = Math.min(this.getSliderMaxMoveHeight(), sliderPositionVal);
			this.$slider.css({
				top: sliderTop + 'px'
			});

			// 选中对应的tab
			var len = this.$anchor.length,
				index,
				anchorPositionArr = [];

			// 获取tab项对应的滚动高度节点
			for (var i = 0; i < len; i++){
				anchorPositionArr.push($cont.scrollTop() + this.getAnchorPosition(i));
			}

			// 获取当前滚动高度对应的tab项索引
			for (var j = len; j >= 0; j--){
				if (contScrollTop >= anchorPositionArr[j]){
					index = j;
					break;
				}
			}

			// 切换切换至对应的tab项
			this.changeSelectedTab(index);
			
		},
		/**
		 * [_bindDragSliderEvent 绑定拖动滑块事件]
		 * @return {[object]} [当前调用对像]
		 */
		_bindDragSliderEvent : function () {
			var self = this,
				$slider = self.$slider,
				sliderEl = $slider[0];//获取原生dom元素

			if (sliderEl){
				var $doc = this.$doc,
					dragStartMousePosition,
					dragStartContScrollPosition,
					contSliderScrollRate;
				// 鼠标按下事件 
				$slider.mousedown(function(e) {
					e.preventDefault();

					// 获取鼠标按下的位置
					dragStartMousePosition = e.pageY;// e.pageX/Y鼠标相对于文档左侧/顶部边缘的距离
					dragStartContScrollPosition = self.$cont[0].scrollTop;// div.scrollTop/Left：元素中的内容超出元素上/左边界的距离
					contSliderScrollRate = self.getContMaxScrollHeight() / self.getSliderMaxMoveHeight();
					
					$doc
					.on('mousemove.scroll', function(e) {// 鼠标滑动事件
						e.preventDefault();
						
						// 鼠标移动的距离和内容应该滚动的高度
						var mouseMoveHeight = e.pageY - dragStartMousePosition;
						var contScrollHeight = mouseMoveHeight * contSliderScrollRate;

						self.scrollTo(dragStartContScrollPosition + contScrollHeight);
						
					})
					.on('mouseup.scroll', function(e) {// 鼠标抬起事件
						$doc.off('.scroll');
					});
					// 为了避免移除$doc上所有的鼠标滑动和鼠标抬起事件，此处使用了事件命名空间
				});
			}

			return this;
		},
		_bindMouseWheel : function () {
			var self = this;
			// DOMMouseScroll是firefox滚轮事件
			this.$cont.on('mousewheel DOMMouseScroll', function(e){
				e.preventDefault();

				// 获取鼠标滚轮事件的原生事件对象
				var oEv = e.originalEvent,
					// 计算滚轮滚动的幅度
					// FF浏览器的是detail是3的倍数，负值代表滚轮向上滚动，其他浏览器则相反
					wheelRange = oEv.wheelDelta ? -oEv.wheelDelta/120 : (eEV.detail || 0)/3;

					self.scrollTo(self.$cont.scrollTop() + wheelRange * self.options.wheelStep);

			});

			return this;
		},
		changeSelectedTab : function (index) {
			var active = this.options.tabActiveClass;

			this.$tabItem
				.eq(index)
				.addClass(active)
				.siblings()
				.removeClass(active);
		},
		/**
		 * [getAnchorPosition 获取锚点位置]
		 * @param  {[number]} index [锚点索引]
		 * @return {[object]}       [this]
		 */
		getAnchorPosition : function (index) {
			// positon()获取元素相对于最近的定位元素的位置
			return this.$anchor.eq(index).position().top;
		},
		_bindTabClick : function () {
			var self = this;
			// tab点击事件
			this.$tabItem.click(function(e) {
				var index = $(this).index();

				self.changeSelectedTab(index);

				// 滚动到对应内容
				self.scrollTo(self.$cont.scrollTop() + self.getAnchorPosition(index));
			});

			return this;
		},
		correctSectionHeight : function () {
			var lastSection = this.$sectionCont.last();

			var contHeight = this.$cont.height(),
				sectionTitleHeight = this.$anchor.eq(0).outerHeight();
				lastSectionHeight = lastSection.height() + sectionTitleHeight;

			if (lastSectionHeight < contHeight){
				var correctHeight = contHeight - lastSectionHeight;
				lastSection.css({
					paddingBottom: correctHeight + 'px'
				});
			}
		}
		
	});

	win.CusScrollBar = CusScrollBar;
	
}(window, document, jQuery);

// 实例化滚动条
var scrollBar = new CusScrollBar();
