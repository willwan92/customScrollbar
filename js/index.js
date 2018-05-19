// ## 逻辑思路
// 1. 根据需要设置滚动条的默认配置项
// 2. 计算滑块可移动距离和内容可滚动高度
// 3. 根据鼠标移动距离设置滑块位置和内容滚动高度

// 自调用匿名函数模拟块级作用域，防止与其他变量名等代码冲突
!function (win, doc, $) {
	// 创建构造函数
	function CusScrollBar(options) {
		//初始化滚动条
		this._init(options);
	}
	
	// 在构造函数的原型上添加初始化滚动条方法_init
	$.extend(CusScrollBar.prototype, {
		_init: function (options) {
			// 缓存this
			var self = this;

			// 设置滚动条的默认配置
			this.options = {
				scrollDir      : "y", 
				contSelector   : "",
				barSelector    : "",
				sliderSelector : "",
				tabItemSelector: ".tab-item",
				tabActiveClass : 'tab-active',
				anchorSelector : '.section-title',
				wheelStep      : 20
			}

			$.extend(true, this.options, options || {});

			this._getDom();
			this._bindDragSliderEvent()
				._bindMouseWheel().
				_bindTabChange();

			return this;
		},
		/**
		 * 获取dom引用
		 * @return {[type]} [description]
		 */	
		_getDom : function () {
			var opts = this.options;
			this.$doc = $(doc);
			this.$cont = $(opts.contSelector);
			this.$slider = $(opts.sliderSelector);
			this.$bar = opts.barSelector ? $(opts.barSelector) : this.$slider.parent();
			this.$tabItem = $(opts.tabItemSelector);
			this.$anchor = $(opts.anchorSelector);
		},
		getContMaxScrollHeight : function () {
			var self = this;

			// div.scrollHeight/Width：获取元素内容的完整高度/或宽度
			// $div.height/width()：获取元素的可视高度/宽度
			return Math.max(self.$cont[0].scrollHeight, this.$cont.height()) - this.$cont.height();
		},
		getSliderMaxMoveHeight : function () {
			var self = this;

			return self.$bar.height() - self.$slider.height();
		},
		scrollTo : function (contScrollPosition) {
			var self = this;
			// 设置内容的scrollTop
			this.$cont.scrollTop(contScrollPosition);

			// 根据内容滚动的高度和相应比率设置滑块的位置 
			// 用scrollTop()而不用contScrollPosition防止取到负值
			var sliderPositionVal = self.$cont.scrollTop() / self.getContMaxScrollHeight() * self.getSliderMaxMoveHeight();
			var sliderTop = Math.min(self.getSliderMaxMoveHeight(), sliderPositionVal);
			self.$slider.css({
				top: sliderTop + 'px'
			});
		},
		_bindDragSliderEvent : function () {
			var self = this,
				$slider = self.$slider,
				sliderEl = $slider[0];//获取原生dom元素

			if (sliderEl){
				var $doc = self.$doc,
					dragStartMousePosition,
					dragStartContScrollPosition,
					sliderMaxMoveHeight,
					contSliderScrollRate;
				
				// 鼠标按下事件 
				$slider.mousedown(function(e) {
					// 阻止默认事件
					e.preventDefault();
					console.log('md');

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
						console.log('mu');
					});
					// 为了避免移除$doc上所有的鼠标滑动和鼠标抬起事件，此处使用了事件命名空间
				});
			}

			return self;
		},
		_bindMouseWheel : function () {
			var self = this;
			console.log(self.$cont);
			// DOMMouseScroll是firefox滚轮事件
			self.$cont.on('mousewheel DOMMouseScroll', function(e){
				e.preventDefault();

				// 获取鼠标滚轮事件的原生事件对象
				var oEv = e.originalEvent,
					// 计算滚轮滚动的幅度
					// FF浏览器的是detail是3的倍数，负值代表向上滚动，其他浏览器则相反
					wheelRange = oEv.wheelDelta ? -oEv.wheelDelta/120 : (eEV.detail || 0)/3;

					self.scrollTo(self.$cont.scrollTop() + wheelRange * self.options.wheelStep);
			});

			return self;
		},
		changeSelectedTab : function (index) {
			var self  = this;
				active = self.options.tabActiveClass;

			self.$tabItem.eq(index).addClass(active).siblings().removeClass(active);
		},
		getAnchorPosition : function (index) {
			// positon()获取元素相对于最经的定位元素的位置
			return this.$anchor.eq(index).position().top;
		},
		_bindTabChange : function () {
			var self = this;
			// tab点击事件
			self.$tabItem.click(function(e) {
				var index = $(this).index();

				self.changeSelectedTab(index);

				// 滚动到对应内容
				self.scrollTo(self.$cont.scrollTop() + self.getAnchorPosition(index));
			});

			
		},
		_bindScrollListen : function () {

		}

	});


	win.CusScrollBar = CusScrollBar;
	
	// ## 实现思路
	// 处理鼠标拖拽滑块事件
	// 绑定鼠标按下事件：获取鼠标起始位置、滑块的起始位置、滑块滑动的距离和内容滚动的比率）
	// 绑定鼠标移动事件：调用mousemoveHandler方法
	// 绑定鼠标抬起事件：接触鼠标按下及移动事件绑定
	// 
	// ## 构造函数
	// 1. _getDom方法: 获取需要的dom对象
	// 2. getMaxScrollPosition
	//  
}(window, document, jQuery);

// 实例化初始化滚动条
var scrollBar = new CusScrollBar({
	contSelector   : ".scroll-cont",
	barSelector    : ".scroll-bar",
	sliderSelector : ".scroll-slider"
});
console.log(scrollBar);