function safeJsonParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

function yearsSinceBirth(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getAge(dob) {
  const age = yearsSinceBirth(dob);
  return age === null ? "--" : age;
}

window.safeJsonParse = safeJsonParse;
window.yearsSinceBirth = yearsSinceBirth;
window.getAge = getAge;
