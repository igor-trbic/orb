/** @jsx React.DOM */

/* global module, require, react */
/*jshint eqnull: true*/

'use strict';

var pbid = 0;

module.exports.PivotButton = react.createClass({
	displayName: 'PivotButton',
	getInitialState: function () {
		this.pbid = ++pbid;

		// initial state, all zero.
		return {
			pos: { x: 0, y: 0 },
			startpos: { x: 0, y: 0 },
			mousedown: false,
			dragging: false
		};
	},
	onFilterMouseDown: function(e) {
		// left mouse button only
		if (e.button !== 0) return;

		var filterButton = this.getDOMNode().childNodes[0].rows[0].cells[2].childNodes[0];
		var filterButtonPos = reactUtils.getOffset(filterButton);
		var filterContainer = document.createElement('div');

        var filterPanelFactory = React.createFactory(comps.FilterPanel);
        var filterPanel = filterPanelFactory({
            field: this.props.field.name,
            pivotTableComp: this.props.pivotTableComp
        });

        filterContainer.className = 'orb-' + this.props.pivotTableComp.pgrid.config.theme + ' orb fltr-cntnr';
        filterContainer.style.top = filterButtonPos.y + 'px';
        filterContainer.style.left = filterButtonPos.x + 'px';
        document.body.appendChild(filterContainer);

        React.render(filterPanel, filterContainer);

		// prevent event bubbling (to prevent text selection while dragging for example)
		e.stopPropagation();
		e.preventDefault();
	},
	onMouseDown: function(e) {
		// drag/sort with left mouse button
		if (e.button !== 0) return;

		var thispos = reactUtils.getOffset(this.getDOMNode());
		
		// inform mousedown, save start pos
		this.setState({
			mousedown: true,
			mouseoffset: {
				x: thispos.x - e.pageX,
				y: thispos.y - e.pageY,
			},
			startpos: {
				x: e.pageX,
				y: e.pageY
			}
		});
		// prevent event bubbling (to prevent text selection while dragging for example)
		e.stopPropagation();
		e.preventDefault();
	},
	componentDidUpdate: function () {
		if (!this.state.mousedown) {
			// mouse not down, don't care about mouse up/move events.
			dragManager.dragElement(null);
			document.removeEventListener('mousemove', this.onMouseMove);
			document.removeEventListener('mouseup', this.onMouseUp);
		} else if (this.state.mousedown) {
			// mouse down, interested by mouse up/move events.
			dragManager.dragElement(this);
			document.addEventListener('mousemove', this.onMouseMove);
			document.addEventListener('mouseup', this.onMouseUp);
		}
	},
	componentWillUnmount : function() {
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	},
	onMouseUp: function() {
		var wasdragging = this.state.dragging;

		this.setState({
			mousedown: false,
			dragging: false,
			size: null,
			pos: {
				x: 0,
				y: 0
			}
		});

		// if button was not dragged, proceed as a click
		if(!wasdragging) {
			this.props.pivotTableComp.sort(this.props.axetype, this.props.field);
		}

		return true;
	},
	onMouseMove: function (e) {
		// if the mouse is not down while moving, return (no drag)
		if (!this.state.mousedown) return;

		var size = null;
		if(!this.state.dragging) {
			size = reactUtils.getSize(this.getDOMNode());
		} else {
			size = this.state.size;
		}

		var newpos = {
			x: e.pageX + this.state.mouseoffset.x,
			y: e.pageY + this.state.mouseoffset.y
		};

		this.setState({
			dragging: true,
			size: size,
			pos: newpos
		});

		dragManager.elementMoved();

		e.stopPropagation();
		e.preventDefault();
	},
	render: function() {
		var self = this;
		var divstyle = {
			left: self.state.pos.x + 'px',
			top: self.state.pos.y + 'px',
			position: self.state.dragging ? 'fixed' : ''
		};

		if(self.state.size) {
			divstyle.width = self.state.size.width + 'px';
		}

		var sortIndicator = self.props.field.sort.order === 'asc' ? 
			' \u2191' :
			(self.props.field.sort.order === 'desc' ?
				' \u2193' :
				'' );

		var filterClass = (self.state.dragging ? '' : 'fltr-btn') + (this.props.pivotTableComp.pgrid.isFieldFiltered(this.props.field.name) ? ' fltr-btn-active' : '');

		return <div key={self.props.field.name} 
		            className={'fld-btn' + (this.props.pivotTableComp.pgrid.config.theme === 'bootstrap' ? ' btn btn-default' : '')}
		            onMouseDown={this.onMouseDown}
		            style={divstyle}>
		            <table>
		            	<tbody>
		            		<tr>
		            			<td style={{padding: 0 }}>{self.props.field.caption}</td>
		            			<td style={{padding: 0, width: 13 }}>{sortIndicator}</td>
		            			<td style={{padding: 0, verticalAlign: 'top' }}>
		            				<div className={filterClass} onMouseDown={self.state.dragging ? null : this.onFilterMouseDown}></div>
		            			</td>
		            		</tr>
		            	</tbody>
		            </table>
		        </div>;
	}
});