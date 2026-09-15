import type {
  AttributePayload,
  CreateProductPayload,
  ImagePayload,
  SaveProductPayload,
  SaveSkuPayload,
} from '@/api/product/product'

export interface ProductFormInput {
  code: string
  name: string
  subtitle: string
  description: string
  // CHG-0015：级联选择路径与品牌 ID 均为字符串雪花 ID
  categoryId: string[]
  brandId: string | null
}

export type EditableSkuPayload = Omit<SaveSkuPayload, 'mainImageUrl'> & {
  mainImageUrl: string | null
}

export function buildProductPayload(
  form: ProductFormInput,
  images: ImagePayload[],
  attributes: AttributePayload[],
  mainImageIndex: number,
): SaveProductPayload {
  return {
    name: form.name.trim(),
    subtitle: form.subtitle.trim() || undefined,
    description: form.description.trim() || undefined,
    categoryId: form.categoryId[form.categoryId.length - 1],
    brandId: form.brandId!,
    images: images.map((image, index) => ({
      objectKey: image.objectKey.trim(),
      imageUrl: image.imageUrl.trim(),
      imageType: index === mainImageIndex ? 'MAIN' : image.imageType === 'MAIN' ? 'GALLERY' : image.imageType,
      sortOrder: index,
      mainFlag: index === mainImageIndex,
    })),
    attributes: attributes.map((attribute, index) => ({
      name: attribute.name.trim(),
      value: attribute.value.trim(),
      sortOrder: attribute.sortOrder ?? index,
    })),
  }
}

export function buildCreateProductPayload(
  form: ProductFormInput,
  payload: SaveProductPayload,
  skus: EditableSkuPayload[],
): CreateProductPayload {
  return {
    ...payload,
    code: form.code.trim(),
    skus: skus.map((sku) => ({
      skuCode: sku.skuCode,
      specifications: sku.specifications,
      salePriceInCents: sku.salePriceInCents,
      mainImageUrl: sku.mainImageUrl ?? undefined,
    })),
  }
}
