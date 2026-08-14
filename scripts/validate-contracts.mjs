import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contractsDir = resolve(root, 'contracts');
const catalogsDir = resolve(contractsDir, 'catalogs');
const schemasDir = resolve(contractsDir, 'schemas');
const errors = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`JSON غير صالح: ${path}: ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

for (const file of [...readdirSync(schemasDir), ...readdirSync(catalogsDir)]) {
  if (!file.endsWith('.json')) continue;
  const directory = readdirSync(schemasDir).includes(file) ? schemasDir : catalogsDir;
  readJson(resolve(directory, file));
}

const packagesCatalog = readJson(resolve(catalogsDir, 'packages.catalog.json'));
const componentsCatalog = readJson(resolve(catalogsDir, 'components.catalog.json'));
const sectorsCatalog = readJson(resolve(catalogsDir, 'sectors.catalog.json'));
const permissionsCatalog = readJson(resolve(catalogsDir, 'permissions.catalog.json'));

if (packagesCatalog && componentsCatalog && sectorsCatalog && permissionsCatalog) {
  const packages = packagesCatalog.packages ?? [];
  const packageKeys = new Set();
  const permissionKeys = new Set();

  for (const resource of permissionsCatalog.resources ?? []) {
    for (const action of resource.actions ?? []) {
      permissionKeys.add(`${resource.scope}:${resource.resource}:${action}`);
    }
  }

  for (const item of packages) {
    assert(/^([a-z][a-z0-9]*)([.-][a-z0-9]+)*$/.test(item.packageKey), `packageKey غير صحيح: ${item.packageKey}`);
    assert(!packageKeys.has(item.packageKey), `packageKey مكرر: ${item.packageKey}`);
    packageKeys.add(item.packageKey);
    assert(item.lifecycle?.activationRequires?.includes('entitlement'), `الحزمة ${item.packageKey} لا تطلب entitlement.`);
    assert(item.lifecycle?.activationRequires?.includes('dependency-check'), `الحزمة ${item.packageKey} لا تطلب فحص dependencies.`);
    assert(item.lifecycle?.activationRequires?.includes('cache-invalidation'), `الحزمة ${item.packageKey} لا تعلن cache invalidation.`);
    for (const permission of item.security?.permissions ?? []) {
      assert(permissionKeys.has(permission), `صلاحية غير معرّفة في الحزمة ${item.packageKey}: ${permission}`);
    }
  }

  for (const item of packages) {
    for (const dependency of item.dependencies ?? []) {
      assert(packageKeys.has(dependency.packageKey), `اعتماد مفقود: ${item.packageKey} → ${dependency.packageKey}`);
    }
    for (const conflict of item.conflicts ?? []) {
      assert(packageKeys.has(conflict), `تعارض يشير إلى حزمة غير موجودة: ${item.packageKey} → ${conflict}`);
    }
  }

  const componentKeys = new Set();
  for (const component of componentsCatalog.components ?? []) {
    assert(!componentKeys.has(component.componentKey), `componentKey مكرر: ${component.componentKey}`);
    componentKeys.add(component.componentKey);
    assert(component.security?.allowsRawHtml === false, `المكون ${component.componentKey} يسمح بـ raw HTML.`);
    assert(component.security?.allowsCustomCss === false, `المكون ${component.componentKey} يسمح بـ custom CSS.`);
    assert(component.security?.allowsCustomJavascript === false, `المكون ${component.componentKey} يسمح بـ custom JavaScript.`);
    for (const requiredPackage of component.requiredPackages ?? []) {
      assert(packageKeys.has(requiredPackage), `المكون ${component.componentKey} يحتاج حزمة غير معرفة: ${requiredPackage}`);
    }
  }

  for (const blueprint of sectorsCatalog.blueprints ?? []) {
    assert(blueprint.provisioning?.requiresReviewBeforePublish === true, `Blueprint ${blueprint.sectorKey} لا يتطلب مراجعة قبل النشر.`);
    for (const packageEntry of blueprint.packages ?? []) {
      assert(packageKeys.has(packageEntry.packageKey), `Blueprint ${blueprint.sectorKey} يشير إلى حزمة غير معرفة: ${packageEntry.packageKey}`);
    }
  }
}

if (errors.length > 0) {
  console.error('فشل فحص العقود:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('نجح فحص العقود: JSON صالح، والمراجع بين الحزم والمكونات والقطاعات والصلاحيات متسقة.');
