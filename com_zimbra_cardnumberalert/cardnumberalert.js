//////////////////////////////////////////////////////////////////////////////
// Zimlet that checks for credit card numbers while composing and alerts before sending email
// @author Zimlet author: Tarang Khandelwal 
//////////////////////////////////////////////////////////////////////////////

function com_zimbra_cardnumberalert() {
}

com_zimbra_cardnumberalert.prototype = new ZmZimletBase();
com_zimbra_cardnumberalert.prototype.constructor = com_zimbra_cardnumberalert;

com_zimbra_cardnumberalert.prototype.init =
function() {
	this.turnONcardnumberalert = this.getUserProperty("turnOnCardNumberAlert") == "true";
};


com_zimbra_cardnumberalert.prototype.initializeRegEx =
function() {
	if (this._cardRegex)
		return;

	this.regexPostfix = "(\\s+|$)";
	this.regexPrefix = "(\\s+|^)";
	this._cardDetailMap = [{
		label: "Visa Card",
		pattern: "4[0-9]{12}(?:[0-9]{3})?"
	},
	{
		label: "Mastercard",
		pattern: "5[1-5][0-9]{14}"
	},
	{
		label: "Amex Card",
		pattern: "3[47][0-9]{13}"	
	},
	{
		label: "Discover Card",
		pattern: "65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})"
	}
	]
	this._cardRegex = [];
	for (var n = 0; n < this._cardDetailMap.length; n++) {
		this._cardRegex.push(new RegExp(this.regexPrefix + this._cardDetailMap[n]["pattern"]+ this.regexPostfix, "g"));
	}
};

com_zimbra_cardnumberalert.prototype.emailErrorCheck =
function(mail, boolAndErrorMsgArray) {
	if (!this.turnONcardnumberalert)
		return;

	this.initializeRegEx();
	this._ignoreWords = [];
	if (mail.isReplied || mail.isForwarded) {
		this._createIgnoreList(mail._origMsg);
	}
	var cardDetailsThatExists = "";
	var newMailContent = mail.textBodyContent.trim();
	for (var k = 0; k < this._cardRegex.length; k++) {
		var cardRegEx = this._cardRegex[k];

		//var newMailArry =  cardRegEx.exec(newMailContent);
		var newMailArry =  newMailContent.match(cardRegEx);
		if (!newMailArry)
			continue;

		var newMailLen = newMailArry.length;
		//if the number of cardRegExs in the new mail is same as origMail, skip it
		if (this._ignoreWords[cardRegEx] != undefined) {
			if (newMailLen <= this._ignoreWords[cardRegEx]) {
				hascardRegExStr = false;
				continue;
			}
		}
		hascardRegExStr = true;
		if (hascardRegExStr) {
				// TODO: get all the card numbers not just index zero.
				cardDetailsThatExists = cardDetailsThatExists + "<b> "+this._cardDetailMap[k]["label"]+"</b> "+ newMailArry[0].trim() + ",";
		}
	}

	if (cardDetailsThatExists == "")
		return null;

	cardDetailsThatExists = cardDetailsThatExists.slice(0, -1);

	//there is  some card number in new mail (but not necessarily in old-mail)
	return boolAndErrorMsgArray.push({hasError:true, errorMsg:"You are probably sending  '" + cardDetailsThatExists + "' credit/debit card details in the mail. You are better off not sharing this information.<BR> Still, send anyway?", zimletName:"com_zimbra_cardnumberalert"});
};


com_zimbra_cardnumberalert.prototype._createIgnoreList =
function(origMail) {
	var bodyContent = origMail.getBodyContent();
	//removing html tags.
	bodyContent = bodyContent.replace(/<\/?[^>]+>/gi, ' ');
	
	/*alternate way to get mail content
	var bodyContent = origMail.textBodyContent; */
	
	for (var k = 0; k < this._cardRegex.length; k++) {
		var cardRegEx = this._cardRegex[k];
		var mailArry = bodyContent.match(cardRegEx);
		if (!mailArry)
			continue;

		this._ignoreWords[cardRegEx] = mailArry.length;
	}
};

com_zimbra_cardnumberalert.prototype.doubleClicked = function() {
	this.singleClicked();
};

com_zimbra_cardnumberalert.prototype.singleClicked = function() {
	this.showPrefDialog();
};

com_zimbra_cardnumberalert.prototype.showPrefDialog =
function() {
	//check if zimlet dialog already exists.
	if (this.pbDialog) {
		this.pbDialog.popup();
		return;
	}
	this.pView = new DwtComposite(this.getShell());
	this.pView.getHtmlElement().innerHTML = this.createPrefView();

	if (this.getUserProperty("turnOnCardNumberAlert") == "true") {
		document.getElementById("cardnumberwordalertZimletNew_chkbx").checked = true;
	}
	this.pbDialog = this._createDialog({title:"Credit/Debit Card Number alert while composing mail", view:this.pView});
	this.pbDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okBtnListner));
	this.pbDialog.popup();
};

com_zimbra_cardnumberalert.prototype.createPrefView =
function() {
	var html = new Array();
	var i = 0;
	html[i++] = "<DIV>";
	html[i++] = "<input id='cardnumberwordalertZimletNew_chkbx'  type='checkbox'/>Enable (Changing this would refresh browser)";
	html[i++] = "</DIV>";
	return html.join("");
};

com_zimbra_cardnumberalert.prototype._okBtnListner =
function() {
	this._reloadRequired = false;
	if (document.getElementById("cardnumberwordalertZimletNew_chkbx").checked) {
		if (!this.turnONcardnumberalert) {
			this._reloadRequired = true;
		}
		this.setUserProperty("turnOnCardNumberAlert", "true", true);
	} else {
		this.setUserProperty("turnOnCardNumberAlert", "false", true);
		if (this.turnONcardnumberalert)
			this._reloadRequired = true;
	}
	this.pbDialog.popdown();

	if (this._reloadRequired) {
		window.onbeforeunload = null;
		var url = AjxUtil.formatUrl({});
		ZmZimbraMail.sendRedirect(url);
	}
};