define(['amd!cdf/lib/underscore'], function(_) {

  function transform(obj) {
    // obj = {
    //   "_": "pentaho/type/filter/isIn",
    //   "property": "id",
    //   "values": [
    //     {_: "string", v: "[Product].[Classic Cars]"},
    //     {_: "string", v: "[Product].[Motorcycles]"},
    //   ]
    // }

    // obj = {
    //   "_": "pentaho/type/filter/and",
    //   "operands": [
    //     {
    //       "_": "pentaho/type/filter/isIn",
    //       "property": "id",
    //       "values": [
    //         {_: "string", v: "[Product].[Line]"}
    //       ]
    //     },
    //     {
    //       "_": "pentaho/type/filter/not",
    //       "operand":  {
    //           "_": "pentaho/type/filter/isIn",
    //           "property": "id",
    //           "values": [
    //             {_: "string", v: "[Product].[Classic Cars]"},
    //             {_: "string", v: "[Product].[Motorcycles]"}
    //           ]
    //       }
    //     }
    //   ]
    // }

    // obj = {
    //   "_": "pentaho/type/filter/isIn",
    //   "property": null,
    //   "values": [
    //   ]
    // }

    /*obj = {
      "_": "pentaho/type/filter/not",
      "operand":  {
          "_": "pentaho/type/filter/isIn",
          "property": "[Product].[Line]",
          "values": [
            {_: "string", v: "[Product].[Classic Cars]"},
            {_: "string", v: "[Product].[Motorcycles]"}
          ]
      }
    }*/

    var exp = parseLevel(obj);

    return '{' + exp + '}';

  }


  function parseLevel(obj) {
    var exp = '';
    var notExp = '';
    var notExists = false;
    var rootOp = getOperand(obj._);

    if (rootOp === 'isIn') {
      // LEAF case
      exp = _.pluck(obj.values, 'v').join();
      if (obj.property === null && obj.values.length) {
        //exp += '.MEMBERS';
      }
      return exp;

    } else if (rootOp === 'not') {
      // there can only exist a NOT ISIN, at the leaf level
      // In practice, we are treating NOT ISIN as a single operator

      notExists = true;
      var notOperand = obj.operand;

      exp = notOperand.property;
      notExp = _.pluck(notOperand.values, 'v').join();

      return 'EXCEPT(' + exp + ', {' + notExp + '})';

    } else if (rootOp === 'or') {

      return '{' + _.map(obj.operands, parseLevel).join(',') + '}';

    } else if (rootOp === 'and') {
      // AND Case

      var expValues = [];
      _.each(obj.operands, function(operand, idx) {
        var op = getOperand(operand._);

        if (op === 'isIn') {
          expValues.push(_.pluck(operand.values, 'v'));
        } else if (op === 'not') {
          notExists = true;
          var notOperand = operand.operand;

          notExp = _.pluck(notOperand.values, 'v').join();
        }
      });
      exp = expValues.join();


    if (notExists) {
      exp = 'EXCEPT(' + exp + ' {' + notExp + '})';
    }

    return exp;
    }
return null;
    throw TypeError('Unrecognized operator');
  }

  function getOperand(operand) {
    return operand ? operand.replace('pentaho/type/filter/', '') : '';
  }


  return {
    transform: transform
  };
});
