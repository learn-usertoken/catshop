/** @jsx React.DOM */

var util = require('util')
var qr = require('qr-encode')
var React = require('react')
var helloblock = require('@helloblock')
var productRemoved = require('./productevents').productRemoved

function generateQR(address, amount) {
  var url = util.format('bitcoin:%s?amount=%d', address, amount)
  var dataUri = qr(url, {type: 6, size: 4, level: 'Q'})
  return dataUri
}

var CheckoutQR = React.createClass({
  getInitialState: function() {
    return {
      done: false,
      status: 'Not confirmed',
      paidValue: 0
    }
  },
  componentDidMount: function() {
    var address = this.props.address
    this.connection = helloblock.connectAndListenForTx(address, function(tx) {
      var value = tx.outputs.filter(function(output) {
        return output.address === address
      }).reduce(function(value, output) {
        return value + output.value
      }, 0)
      this.setState({
        done: true,
        status: 'Confirmed (' + tx.confirmations + ')',
        paidValue: this.state.paidValue + (value / 100000000)
      })
    }.bind(this), function(error) {
      this.setState({
        done: true,
        status: 'Failed: ' + err,
        paidValue: 0
      })
    }.bind(this))
  },
  componentWillUnmount: function() {
    this.connection.close()
  },
  handleDoneClick: function(e) {
    productRemoved.publish(null)
    this.props.onRequestHide(e)
  },
  render: function() {
    var doneEnabled = this.state.done && (this.state.paidValue >= this.props.totalPrice)
    return (
      <div>
        <div className="modal-body center">
          <p>Please send {this.props.totalPrice} BTC to <strong>{this.props.address}</strong></p> 
          <p>(already paid {this.state.paidValue})</p>
          <img src={generateQR(this.props.address, this.props.totalPrice)} />
          <p>Status:&nbsp;
            { this.state.paidValue >= this.props.totalPrice ? <span className="glyphicon glyphicon-ok"></span> : null }
            {this.state.status}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" onClick={this.props.onRequestHide}>
            Cancel
          </button>
          <button type="button" className="btn btn-success" disabled={!doneEnabled} onClick={this.handleDoneClick}>
            Done <span className="glyphicon glyphicon-play"></span>
          </button>
        </div>
      </div>
    )
  }
})

module.exports = CheckoutQR
