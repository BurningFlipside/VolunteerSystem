<?php
require_once('class.SecurePage.php');
$page = new SecurePage('Burning Flipside - Flipside Volunteer System');

$page->add_js_from_src('scripts/init_page.js');
$page->add_js_from_src('scripts/question_node.js');
$page->add_js_from_src('scripts/volunteer_position.js');

$page->add_head_tag('
<script type="text/javascript">function doYes(){var answer=window.currentNode.GetYes();handleNode(answer)}
function doNo(){var answer=window.currentNode.GetNo();handleNode(answer);}
function updateQuestionText(){var questionText=document.getElementById("question_text");questionText.innerHTML=window.currentNode.GetQuestion();}
function handleNode(answer){if(answer instanceof VolunteerPosition){answer.createNode();}else if(answer instanceof QuestionNode){window.currentNode=answer;updateQuestionText();}}</script>
');

$page->body .= '
<div id="content">
<div id="main_div">
    <table height="100%" width="100%" align="center" id="main_table" class="table">
        <tr><td colspan="3">&nbsp;</td>
        <tr><td colspan="3" align="center" id="question_cell"><h2 id="question_text">Does this shit work?</h2></td></tr>
        <tr>
            <td id="yes" ><a href=# onclick="doYes()"><img src="images/yes.jpg" class="img-responsive"></a></td>
            <td style="width:20%;">&nbsp;</td>
            <td id="no" ><a href=# onclick="doNo()"><img src="images/no.jpg" class="img-responsive"></a></td>
        </tr>
    </table>
</div>
<div id="VC_Footer">
Confused about anything you see here?  Did you find an error or a dead link?  You might want to visit the <a href="http://wiki.burningflipside.com/wiki/Volunteer_Coordinator">Volunteer Coordinator page on Pyropedia</a> or email the volunteer team at <a href="mailto:volunteerinfo@burningflipside.com">volunteerinfo@burningflipside.com</a>
</div>
</div>
<script type="text/javascript">
    init_page();
    updateQuestionText();
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

$page->print_page();
?>
