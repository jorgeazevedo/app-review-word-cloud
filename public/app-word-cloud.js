// Encapsulate the word cloud functionality
function wordCloud(selector) {

    var fill = d3.scale.category20();

    //Construct the word cloud's SVG element
    var svg = d3.select(selector)
        .attr("width", 500)
        .attr("height", 500)
        .append("g")
        .attr("transform", "translate(250,250)");

    function colorForSize(size) {
        return "hsl(202, " + (1.82 * parseInt(size) - 17.65) + "%, " + ((-1.06 * parseInt(size)) + 90.6) + "%)";
    }

    //Draw the word cloud
    function draw(words) {
        var cloud = svg.selectAll("g text")
                        .data(words, function(d) { return d.text; })

        //Entering words
        cloud.enter()
            .append("text")
            .style("font-family", "sans-serif")
            .style("fill", function(d, i) { return colorForSize(d.size) })
            .attr("text-anchor", "middle")
            .attr('font-size', 1)
            .text(function(d) { return d.text; });

        //Entering and existing words
        cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) { return (parseInt(d.size) * 0.8) + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("fill-opacity", 1);

        //Exiting words
        cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }


    //Use the module pattern to encapsulate the visualisation code. We'll
    // expose only the parts that need to be public.
    return {

        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words) {
            d3.layout.cloud().size([500, 500])
                .words(words)
                .padding(5)
                .rotate(0)
                .font("Impact")
                //.fontStyle("fill", "hsl(102, 100%, 21.6%)")
                //.fontStyle(function(d) { return "hsl(202, 100%, " + d.size + "%)"})
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();
        }
    }

}

//Some sample data - http://en.wikiquote.org/wiki/Opening_lines
var words = [
    "You don't know about me without you have read a book called The Adventures of Tom Sawyer but that ain't no matter.",
    "The boy with fair hair lowered himself down the last few feet of rock and began to pick his way toward the lagoon.",
    "When Mr. Bilbo Baggins of Bag End announced that he would shortly be celebrating his eleventy-first birthday with a party of special magnificence, there was much talk and excitement in Hobbiton.",
    "It was inevitable: the scent of bitter almonds always reminded him of the fate of unrequited love."
]

//Prepare one of the sample sentences by removing punctuation,
// creating an array of words and computing a random size attribute.
function getWords(i) {
    return words[i]
            .replace(/[!\.,:;\?]/g, '')
            .split(' ')
            .map(function(d) {
                return {text: d, size: 10 + Math.random() * 60};
            })
}

var myWordCloud;

$( document ).ready(function() {


var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
$("#slider").dateRangeSlider({
    bounds:{
        min: new Date(2015, 6, 1),
        max: new Date(2016, 3, 15)
    },
    defaultValues:{
        min: new Date(2016, 2, 15),
        max: new Date(2016, 3, 15)
    },
    scales: [{
      first: function(value){ return value; },
      end: function(value) {return value; },
      next: function(value){
        var next = new Date(value);
        return new Date(next.setMonth(value.getMonth() + 1));
      },
      label: function(value){
        return months[value.getMonth()];
      },
      format: function(tickContainer, tickStart, tickEnd){
        tickContainer.addClass("myCustomClass");
      }
}]});

$("#slider").bind("valuesChanged", function(e, data){
    var startDate = data.values.min.toISOString().slice(0, 10);
    var endDate = data.values.max.toISOString().slice(0, 10);

    console.log("Values just changed. min: " + startDate + " max: " + endDate);
    $('#div1').html("Fetching data")
    $('#records_table > thead').html("");
    $('#records_table > tbody').html("");
    
    fetchData(startDate, endDate, function(err, data){
        if(err) console.log(err)
        console.log("worldCloud:" + JSON.stringify(data.wordCloud))
        
        myWordCloud.update(data.wordCloud);
    });
});


    //Create a new instance of the word cloud visualisation.
    // WordCloud is a {update: function(words)}
    // words is a [{text: str, size: int},{text: str, size: int}]
    myWordCloud = wordCloud('#cloud');
    //myWordCloud.update(getWords(1 % words.length))
});



function fetchData(startDate, endDate, callback) {
    var rating = $('#rating').val() ? $('#rating').val() : 1;
    console.log(rating);
    $.ajax({
        url: "/api/android/" + startDate + "/" + endDate +"/" + rating,
        type: "GET",
        success: function(result) {
            var dummy = JSON.parse(result)

            var tableHeader = Object.keys(dummy.reviews[0]).map(function(elem) {
                return "<th>" + elem + "</th>"
            }).join(" ");

            var rows = dummy.reviews.map(function(review) {
                var row = Object.keys(review).map(function(elem) {
                    return "<td>" + review[elem] + "</td>";
                }).join("");
                return "<tr>" + row + " </tr>";
            }).join("");

            $('#div1').html("Got " + dummy.reviews.length + " results")
            $('#records_table > thead').append("<tr>" + tableHeader + " </tr>");
            $('#records_table > tbody').append(rows);
            if(typeof callback === "function") callback(null, dummy);
        },
        error: function(httpReq, status, exception) {
            console.error(status + " " + exception);
            if(typeof callback === "function") callback(exception, {});
        }
    });    
}

fetchData("2015-11-01", "2015-11-30", function(err, data){
        if(err) console.log(err)
        console.log("worldCloud:" + JSON.stringify(data.wordCloud))
        
        myWordCloud.update(data.wordCloud);
    });

