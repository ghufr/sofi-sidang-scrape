const splitKodeNama = (val) => {
  const [kode, nama] = val.split('-');
  return { kode: kode.trim(), nama: nama.trim() };
};

const transformer = {
  pembimbing_1: splitKodeNama,
  pembimbing_2: splitKodeNama,
  tak: (val) => parseInt(val, 10),
  eprt: (val) => parseInt(val, 10),
  jumlah_bimbingan: (val) =>
    val
      .trim()
      .split('\n')
      .map((val) =>
        parseInt(
          val
            .replace(/([a-zA-Z ])/g, '')
            .trim()
            .split(':')[1],
          10,
        ),
      ),
};

const transform = (key, value) => {
  let result = {};
  const transformed = transformer[key] && transformer[key](value);

  switch (typeof transformed) {
    case 'object':
      if (transformed.length > 0) {
        transformed.map((item, i) => {
          result = { ...result, [`${key}_${i + 1}`]: item };
        });
      } else {
        result = { [key]: transformed };
      }
      break;
    default:
      result = { [key]: transformed || value };
  }

  return result;
};

// const normalize = ;

export default { transform };
