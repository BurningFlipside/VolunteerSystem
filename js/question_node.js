// Question node
function QuestionNode(questionText, yes, no){
    this.text = questionText;
    this.yesAnswer = yes;
    this.noAnswer = no;
}

QuestionNode.prototype.GetQuestion = function(){
    return this.text;
}

QuestionNode.prototype.GetYes = function(){
    return this.yesAnswer;
}

QuestionNode.prototype.GetNo = function(){
    return this.noAnswer;
}