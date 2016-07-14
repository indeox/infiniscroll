import Fastdom from 'fastdom';
import _ from 'lodash';

class InfiniScroll {
    constructor(opts = {}) {
        this.$node = $(opts.el).first();
        this.renderItem = opts.renderItem || function (itemToRender) {
            return itemToRender.html;
        };

        this.onScroll = opts.onScroll || function () {
            /* 
                No-op        
                This gets called with:
                {
                    distanceFromTop: XXX,
                    distanceFromBottom: XXX
                }
            */
        };

        this.renderFrom = 0;
        this.distanceFromTop = 0;
        this.distanceFromBottom = 0;

        this.content = []; //[...opts.content];
        this.contentIds = [];

        this.setup();
        this.layout();
    }

    setup() {
        this.$node.css('height', '100%');
        this.$overallContainer = $('<div/>');
        this.$contentContainer = $('<div/>');

        this.$overallContainer.css({
            'position': 'relative',
            'contain': 'layout' // Only available in Chrome 52
        });
        this.$contentContainer.css('transform', 'translate(0,0)');

        this.$overallContainer.append(this.$contentContainer);
        this.$node.append(this.$overallContainer);

        this.$node.on('scroll', this.updateFrame);
    }

    addContent(newContent) {
        // TODO: Make this.content immutable
        newContent.forEach(item => {
            let existingItemIndex = this.contentIds.indexOf(item.id);

            if (existingItemIndex !== -1) {
                this.content[existingItemIndex] = item;
            } else {
                // Apply a sortIndex if not provided   
                // TODO: Remove dependency on sortIndex             
                item.sortIndex = typeof(item.sortIndex) === 'undefined' ? this.content[this.content.length - 1].sortIndex + 1 : item.sortIndex;
                this.content.push(item);
            }
        });

        // Keep content always sorted
        this.content = _.sortBy(this.content, 'sortIndex');

        this.contentIds = this.content.map(item => item.id);

        this.updateFrame({
            retainScrollPosition: true
        });
    }

    replaceContent(content) {
        this.content = [...content];
        this.content = _.sortBy(this.content, 'sortIndex');
        this.contentIds = this.content.map(item => item.id);

        this.updateFrame({
            retainScrollPosition: true
        });
    }

    append(item) {
        // Adds an item to the bottom of the list
        item.sortIndex = this.content[this.content.length - 1].sortIndex + 1;
        this.content.push(item);

        this.updateFrame({
            retainScrollPosition: true
        });
    }

    removeById(itemId) {
        // Removes an item by ID
        const removeIndex = _.findIndex(this.content, { id: itemId });
        if (removeIndex !== -1) {
            this.content.splice(removeIndex, 1);

            this.updateFrame({
                retainScrollPosition: true
            });
        }
    }

    layout() {
        this.containerHeight = this.$node[0].clientHeight;
    }

    getOffset(el) {
        let offset = el.clientLeft || 0;
        do {
            offset += el.offsetTop || 0;
        } while (el == el.offsetParent); // MIGHT NEED FIXING

        return offset;
    }

    getScrollSize() {
        return this.$node[0].scrollHeight;
    }

    getViewportSize() {
        return this.$node[0].clientHeight;
    }

    getSizeOf(index) {
        if (this.content[index].height) {
            return this.content[index].height;
        }

        // Temporarily add the element to the DOM to capture the height
        // TODO: This really needs to be done better
        let itemEl = document.createElement('div');
        itemEl.innerHTML = this.renderItem(this.content[index]);
        this.$contentContainer[0].appendChild(itemEl);
        let height = itemEl.offsetHeight;
        this.$contentContainer[0].removeChild(itemEl);

        this.content[index].height = height;

        return height;
    }

    getSpaceBefore(index, cache = {}) {
        // Accumulate sizes of items from - index.
        let space = 0; // cache[index] || 0;
        for (let i = 0; i < index; i++) {
            //cache[i] = space;
            const itemSize = this.getSizeOf(i);
            if (itemSize == null) { break; }
            space += itemSize;
        }

        return space;
    }

    getSpaceBeforeItem(itemId) {
        let space = 0;
        let i = 0;

        while (this.content[i] && this.content[i].id !== itemId && i < this.content.length) {
            space += this.getSizeOf(i);
            i += 1;
        }

        return space;
    }

    getStartAndEnd() {
        const threshold = 200;
        const scroll = this.$node[0].scrollTop;
        const start = Math.max(0, scroll - threshold);

        this.viewportSize = this.getViewportSize();

        let end = scroll + this.viewportSize + threshold;
        end = Math.min(end, this.getSpaceBefore(this.content.length));
        return {start, end};
    }

    updateFrame = (opts) => {
        const {start, end} = this.getStartAndEnd();
        const length = this.content.length;
        const pageSize = 10;
        const maxFrom = length - 1;

        let space = 0;
        let renderFromIndex = 0;
        let size = 0;

        while (renderFromIndex < maxFrom) {
            const itemSize = this.getSizeOf(renderFromIndex);
            if (itemSize == null || space + itemSize > start) { break; }
            space += itemSize;
            renderFromIndex += 1;
        }

        const maxSize = length - renderFromIndex;

        while (size < maxSize && space < end) {
            const itemSize = this.getSizeOf(renderFromIndex + size);
            if (itemSize == null) {
                size = Math.min(size + pageSize, maxSize);
                break;
            }
            space += itemSize;
            size += 1;
        }

        this.renderFrom = renderFromIndex;
        this.renderSize = size;
        this.renderTo = this.renderFrom + this.renderSize;
        this.renderFromId = this.content[this.renderFrom].id;

        this.render(opts);

        this.onScroll({
            distanceFromTop: this.distanceFromTop,
            distanceFromBottom: this.distanceFromBottom
        });
    }

    render({ retainScrollPosition }) {
        const toRender = this.content.slice(this.renderFrom, this.renderTo).map(item => item);
        const bottomItem = this.content.length;
        const yOffset = this.getSpaceBefore(this.renderFrom);
        const aboveHeightHasChanged = this.previousRenderFromId && yOffset !== this.getSpaceBeforeItem(this.previousRenderFromId);
        let totalScrollHeight = this.getSpaceBefore(bottomItem);

        // If the viewport is larger than the total
        // number of items inside it, then expand viewport to fill
        if (totalScrollHeight < this.viewportSize) {
            totalScrollHeight = this.viewportSize;
        }

        this.$overallContainer[0].style.height = totalScrollHeight + 'px';
        this.$contentContainer[0].style.transform = `translate(0, ${yOffset}px)`;

        const toRenderIds = toRender.map(item => item.id);
        const childNodes = this.$contentContainer[0].childNodes;
        const renderedIds = Array.from(childNodes).map(el => el.getAttribute('key'));

        // Poor man's DOM diff        
        toRender.forEach((item, index) => {
            let isAlreadyRendered = renderedIds.indexOf(item.id) !== -1;

            if (isAlreadyRendered) {
                return;
            }

            // Add elements as needed
            let elToInsert = document.createElement('div');
            elToInsert.innerHTML = this.renderItem(item);
            elToInsert = elToInsert.childNodes[0];
            elToInsert.setAttribute('key', item.id);

            if (!childNodes[index]) {
                // Append node if non-existent (only happens on the first run)
                this.$contentContainer[0].appendChild(elToInsert);
            } else if (!isAlreadyRendered) {
                // Otherwise insert it at the intended position
                this.$contentContainer[0].insertBefore(elToInsert, childNodes[index]);
            };

            // Cache the height of the element if not already done
            item.height = item.height || elToInsert.offsetHeight;
        });

        // Remove elements
        Array.from(childNodes).forEach(el => {
            let key = el.getAttribute('key');
            if (toRenderIds.indexOf(key) === -1) {
                this.$contentContainer[0].removeChild(el);
            }
        });

        // Retain Scroll position
        // Compare the new totalScrollHeight with the previous one,
        // and adjust scrollTop for any difference
        const isScrolledToTop = this.$node[0].scrollTop <= 1;

        if (renderedIds[0] && retainScrollPosition && isScrolledToTop) {
            // Auto-animate new content in when scrolled to the top
            const finalScrollPosition = this.$node[0].scrollTop + this.getSpaceBeforeItem(renderedIds[0]);
            this.$node[0].scrollTop = finalScrollPosition;
            
            this.scrollToTop(100);

        } else if (retainScrollPosition && aboveHeightHasChanged === true) {
            // This maintains scroll position when the column is
            // scrolled away from the top
            let heightDifference = (totalScrollHeight - this.previousScrollHeight);
            this.$node[0].scrollTop += heightDifference;
        }

        // Keep the distance properties updated
        this.distanceFromTop = this.$node[0].scrollTop;
        this.distanceFromBottom = totalScrollHeight - this.viewportSize - this.distanceFromTop;
        this.previousScrollHeight = totalScrollHeight;
        this.previousRenderFromId = this.renderFromId;
    }

    scrollToTop(duration = 300) {
        this.$node.animate({
            scrollTop: 0
        }, duration);
    }
}

module.exports = InfiniScroll;
