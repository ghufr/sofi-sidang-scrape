const transform = (values) => {
  let result = {};

  Object.keys(values).map((key) => {
    const val = values[key];
    switch (typeof val) {
      case 'object':
        if (val.length > 0) {
          // if value is array
        } else {
          // if value is object
          const subkeys = Object.keys(val);
          subkeys.map((subkey) => {
            result = { ...result, [`${key}_${subkey}`]: val[subkey] };
          });
        }
        break;
      default:
        result = { ...result, [key]: val };
    }
  });

  return result;
};

const denormalize = { transform };

export default denormalize;
