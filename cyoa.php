<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->addJSByURI('js/init_page.js', false);
$page->addJSByURI('js/question_node.js', false);
$page->addJSByURI('js/volunteer_position.js', false);

$page->add_head_tag('
<script type="text/javascript">function doYes(){var answer=window.currentNode.GetYes();handleNode(answer)}
function doBack(){
        if(window.nodes.length == 1){
            window.alert("cannot go back from the start!");
        } else if (document.getElementById("result")){
            var mainDiv = document.getElementById("main_div");
            mainDiv.removeChild(document.getElementById("result"));
            if(document.getElementById("div_email_addr")){
                mainDiv.removeChild(document.getElementById("div_email_addr"));
            }
            if(document.getElementById("position_description")){
                mainDiv.removeChild(document.getElementById("position_description"));
            }
            if(document.getElementById("reset_page_div")){
                mainDiv.removeChild(document.getElementById("reset_page_div"));
            }
            mainDiv.appendChild(window.mainTable);
        } else {
            window.nodes.pop();
            window.currentNode = window.nodes[window.nodes.length-1];
            updateQuestionText();
        }
    }
function doNo(){var answer=window.currentNode.GetNo();handleNode(answer);}
function updateQuestionText(){var questionText=document.getElementById("question_text");questionText.innerHTML=window.currentNode.GetQuestion();}
function handleNode(answer){if(answer instanceof VolunteerPosition){answer.createNode();}else if(answer instanceof QuestionNode){window.currentNode=answer;updateQuestionText();}window.nodes.push(currentNode);}</script>
');

$page->body .= '
<div id="content">
<div id="main_div">
    <table height="100%" width="100%" align="center" id="main_table" class="table">
        <!--<tr><td colspan="3">&nbsp;</td>-->
        <tr><td colspan="3" align="center" id="question_cell"><h2 id="question_text">Does this shit work?</h2></td></tr>
        <tr>
            <td id="yes" ><a href=# onclick="doYes()"><img src="images/yes.jpg" class="img-responsive"></a></td>
            <td style="width:20%;">&nbsp;</td>
            <td id="no" ><a href=# onclick="doNo()"><img src="images/no.jpg" class="img-responsive"></a></td>
        </tr>
    </table>
</div>
<div id="VC_Footer">
    <p>
        <a href=# onclick="doBack()">Or, maybe you\'d like to go back to your previous quesiton?</a>
    </p>
    <p>
    Confused about anything you see here?  Did you find an error or a dead link?  You might want to visit the <a href="http://wiki.burningflipside.com/wiki/Volunteer_Coordinator">Volunteer Coordinator page on Pyropedia</a> or email the volunteer team at <a href="mailto:volunteerinfo@burningflipside.com">volunteerinfo@burningflipside.com</a>
    </p>
</div>
</div>
<script type="text/javascript">
    window.nodes = new Array();
    init_page();
    updateQuestionText();
    window.nodes.push(window.currentNode);
    function reload(){
        location.reload();
    }
    function image_not_found(){
        var imageNode = document.getElementById("volunteer_image");
        imageNode.src = "images/lostimage.png";
        imageNode.style.width="470px";
    }
</script>
';

$page->printPage();
