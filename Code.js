/**
* Calculates an Option's Delta using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @param {string} optiontype - The the type of option, Call or Put.
* @return the Black-Scholes calculation for an option's Delta.
* @customfunction
*/
function OPTIONDELTA(price, strike, volatility, interest, dividend, days, optiontype) {
  var eqt = Math.exp(-dividend *(days/365));
  var nd1 = NORMDIST_(D1_(price, strike, volatility, interest, dividend, days));
  
  if (optiontype == "Put")
  {
	nd1 = nd1 - 1;
  }
  
  return eqt * nd1;
}

/**
* Calculates an Option's Gamma using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @return the Black-Scholes calculation for an option's Gamma.
* @customfunction
*/
function OPTIONGAMMA(price, strike, volatility, interest, dividend, days) {
  var d1 = D1_(price, strike, volatility, interest, dividend, days);
  var time = days/365;
  var eqt = Math.exp(-dividend * time);
  var asqrtT = volatility * Math.sqrt(time);
  
  return Math.exp(-1 * Math.pow(d1, 2)/2)/Math.sqrt(2*Math.PI)*eqt/(price*asqrtT);  
}


/**
* Calculates an Option's Theta using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @param {string} optiontype - The the type of option, Call or Put.
* @return the Black-Scholes calculation for an option's Theta.
* @customfunction
*/
function OPTIONTHETA(price, strike, volatility, interest, dividend, days, optiontype) {
  var d1 = D1_(price, strike, volatility, interest, dividend, days);
  var time = days/365;
  var eqt = Math.exp(-dividend * time);
  var xert = Math.exp(-interest * time) * strike;
  var nd1 = NORMDIST_(D1_(price, strike, volatility, interest, dividend, days));
  
  if (optiontype == "Put")
  {
	return (-(price*Math.exp(-1*Math.pow(d1,2)/2)/Math.sqrt(2*Math.PI)*volatility*eqt/(2*Math.sqrt(time)))+(interest*xert*nd1)-(dividend*price*nd1*eqt))/365;  
  }
  
  return (-(price*Math.exp(-1*Math.pow(d1,2)/2)/Math.sqrt(2*Math.PI)*volatility*eqt/(2*Math.sqrt(time)))-(interest*xert*nd1)+(dividend*price*nd1*eqt))/365;
}


/**
* Calculates an Option's Vega using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @param {string} optiontype - The the type of option, Call or Put.
* @return the Black-Scholes calculation for an option's Vega.
* @customfunction
*/
function OPTIONVEGA(price, strike, volatility, interest, dividend, days) {
  var d1 = D1_(price, strike, volatility, interest, dividend, days);
  var time = days/365;
  var eqt = Math.exp(-dividend * time);
  
  return Math.exp(-1*Math.pow(d1,2)/2)/Math.sqrt(2*Math.PI)*eqt*price*Math.sqrt(time)/100;
}


/**
* Calculates an Option's Rho using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @return the Black-Scholes calculation for an option's Rho.
* @customfunction
*/
function OPTIONRHO(price, strike, volatility, interest, dividend, days, optiontype) {
  var time = days/365;
  var ert = Math.exp(-interest * time);
  
  if (optiontype == "Put")
  {
	var nNegD2 = NORMDIST_(-D2_(price, strike, volatility, interest, dividend, days));
  
	return -strike * time * ert * nNegD2/100;
  }
  
  var nNegD1 = NORMDIST_(-D1_(price, strike, volatility, interest, dividend, days));
  
  return strike * time * ert * nNegD1/100;
}

/**
* Calculates Option Price using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @param {string} optiontype - The the type of option, Call or Put.
* @return the price of an Option.
* @customfunction
*/
function OPTIONPRICE(price, strike, volatility, interest, dividend, days, optiontype) {
  var time = days / 365;
  var xert = Math.exp(-interest * time) * strike;
  var seqt = Math.exp(-dividend * time) * price;

  if (optiontype == "PUT") {
    var nNegD1 = NORMDIST_(D1_(price, strike, volatility, interest, dividend, days) * -1);
    var nNegD2 = NORMDIST_(D2_(price, strike, volatility, interest, dividend, days) * -1);

    return (xert * nNegD2) - (seqt * nNegD1);
  }

  var nD1 = NORMDIST_(D1_(price, strike, volatility, interest, dividend, days));
  var nD2 = NORMDIST_(D2_(price, strike, volatility, interest, dividend, days));


  return (seqt * nD1) - (xert * nD2);
}

/**
* Calculates D1 using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @return the value of D1.
* @customfunction
*/
function D1_(price, strike, volatility, interest, dividend, days) {
  var time = days/365;
  var lnsx = Math.log(price/strike);
  var trqa = (interest - dividend + (Math.pow(volatility, 2))/2)*time;
  var asqrtT = volatility * Math.sqrt(time);
  
  return (lnsx + trqa)/asqrtT;
}

/**
* Calculates D2 using the Black-Scholes Model.
*
* @param {number} price - The spot price of the underlying asset.
* @param {number} strike - The strike price of the option.
* @param {number} volatility - The volatility of returns of the underlying asset.
* @param {number} interest - The input the risk-free interest rate.
* @param {number} dividend - The dividend rate as a percentage.
* @param {number} days - The time to maturity in days.
* @return the value of D2.
* @customfunction
*/
function D2_(price, strike, volatility, interest, dividend, days) {
  var time = days/365;
  var d1 = D1_(price, strike, volatility, interest, dividend, days);
  var asqrtT = volatility * Math.sqrt(time);
  
  return d1 - asqrtT;
}

/**
* Calculates an estimation of the normal distribution of a value.
*
* @param {number} d - The d value.
* @return the value of the normal distribution of d.
* @customfunction
*/
function NORMDIST_(d) {
  var z = (d)/Math.sqrt(2);
  var t = 1/(1+0.3275911*Math.abs(z));
  var a1 =  0.254829592;
  var a2 = -0.284496736;
  var a3 =  1.421413741;
  var a4 = -1.453152027;
  var a5 =  1.061405429;
  var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
  var sign = 1;
  if(z < 0)
  {
	sign = -1;
  }
  
  return (1/2)*(1+sign*erf);
}

/**
 * @customfunction
 */
function ResetSheets() {
  var spreadsheet = SpreadsheetApp.getActive();
  const symbols = ['SPY', 'GME']
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName('$TNX Comparison'), true);
  spreadsheet.getRange("A3:D").clearContent();

  spreadsheet.setActiveSheet(spreadsheet.getSheetByName('$TNX Price History'), true);
  spreadsheet.getRange("A6:C").clearContent();

  for(const _symbol of symbols) {
    spreadsheet.setActiveSheet(spreadsheet.getSheetByName(`${_symbol} Price History`), true);
    spreadsheet.getRange("A6:C").clearContent();
    spreadsheet.setActiveSheet(spreadsheet.getSheetByName(`${_symbol} CALL`), true);
    spreadsheet.getRange("A1:M").clearContent();
    spreadsheet.setActiveSheet(spreadsheet.getSheetByName(`${_symbol} PUT`), true);
    spreadsheet.getRange("A1:M").clearContent();
  }

};
